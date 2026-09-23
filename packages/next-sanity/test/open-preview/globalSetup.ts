import {spawn, type ChildProcess} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const appOrigin = 'http://127.0.0.1:3000'
const appDirectory = fileURLToPath(new URL('../../../../apps/mvp/', import.meta.url))
const startupTimeout = 120_000

function requireEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is required for the Open preview integration test. ` +
        'Use a token that can access the configured Sanity project and dataset.',
    )
  }
  return value
}

async function waitForApp(
  process: ChildProcess,
  output: string[],
  deadline = Date.now() + startupTimeout,
): Promise<void> {
  if (process.exitCode !== null) {
    throw new Error(`Next.js exited before becoming ready:\n${output.join('')}`)
  }
  if (Date.now() >= deadline) {
    throw new Error(`Next.js did not become ready within ${startupTimeout}ms:\n${output.join('')}`)
  }

  try {
    const response = await fetch(`${appOrigin}/open-preview`)
    if (response.ok) return
  } catch {
    // The server is still starting.
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 250))
  return waitForApp(process, output, deadline)
}

function stopApp(process: ChildProcess): void {
  if (!process.pid || process.exitCode !== null) return

  try {
    process.kill('SIGTERM')
  } catch {
    // The process exited between the status check and the signal.
  }
}

export default async function setupOpenPreviewFixture(): Promise<() => void> {
  const token = requireEnvironment('SANITY_TEST_STUDIO_AUTH_TOKEN')
  const projectId = process.env['SANITY_E2E_PROJECT_ID'] || 'ppsg7ml5'
  const dataset = process.env['SANITY_E2E_DATASET'] || 'test'
  const output: string[] = []
  const app = spawn('pnpm', ['exec', 'next', 'dev', '--hostname', '0.0.0.0', '--port', '3000'], {
    cwd: appDirectory,
    env: {
      ...process.env,
      NEXT_PUBLIC_SANITY_DATASET: dataset,
      NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
      NEXT_PUBLIC_TEST_PREVIEW_ORIGIN: appOrigin,
      NEXT_PUBLIC_TEST_PREVIEW_PATH: '/open-preview',
      SANITY_API_READ_TOKEN: token,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  app.stdout?.on('data', (chunk: Buffer) => output.push(chunk.toString()))
  app.stderr?.on('data', (chunk: Buffer) => output.push(chunk.toString()))

  try {
    await waitForApp(app, output)
  } catch (error) {
    stopApp(app)
    throw error
  }

  return () => stopApp(app)
}
