import {spawn, type ChildProcess} from 'node:child_process'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {studioOrigin} from './command.ts'

const appOrigin = 'http://127.0.0.1:3000'
const appDirectory = fileURLToPath(new URL('../../../../apps/mvp/', import.meta.url))
const studioDirectory = fileURLToPath(new URL('../../../../apps/studio/', import.meta.url))
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

interface Server {
  name: string
  process: ChildProcess
  output: string[]
}

function startServer(
  name: string,
  cwd: string,
  [bin, ...args]: [string, ...string[]],
  env: Record<string, string>,
): Server {
  const output: string[] = []
  // Spawned without `pnpm exec` and in its own process group, so `stopServer` reaches the dev
  // server and every worker it forks instead of leaving them holding the port.
  const child = spawn(join(cwd, 'node_modules', '.bin', bin), args, {
    cwd,
    detached: true,
    env: {...process.env, ...env},
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.on('data', (chunk: Buffer) => output.push(chunk.toString()))
  child.stderr?.on('data', (chunk: Buffer) => output.push(chunk.toString()))
  return {name, process: child, output}
}

async function waitForServer(
  server: Server,
  url: string,
  deadline = Date.now() + startupTimeout,
): Promise<void> {
  if (server.process.exitCode !== null) {
    throw new Error(`${server.name} exited before becoming ready:\n${server.output.join('')}`)
  }
  if (Date.now() >= deadline) {
    throw new Error(
      `${server.name} did not become ready within ${startupTimeout}ms:\n${server.output.join('')}`,
    )
  }

  try {
    const response = await fetch(url)
    if (response.ok) return
  } catch {
    // The server is still starting.
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 250))
  return waitForServer(server, url, deadline)
}

function stopServer({process: child}: Server): void {
  if (!child.pid || child.exitCode !== null) return

  try {
    // `sanity dev` doesn't reliably exit on SIGTERM or SIGINT while its schema watcher runs.
    process.kill(-child.pid, 'SIGKILL')
  } catch {
    // The process exited between the status check and the signal.
  }
}

export default async function setupOpenPreviewFixture(): Promise<() => void> {
  const token = requireEnvironment('SANITY_TEST_STUDIO_AUTH_TOKEN')
  const projectId = process.env['SANITY_E2E_PROJECT_ID'] || 'ppsg7ml5'
  const dataset = process.env['SANITY_E2E_DATASET'] || 'test'
  const {port: studioPort} = new URL(studioOrigin)

  const app = startServer(
    'Next.js',
    appDirectory,
    ['next', 'dev', '--webpack', '--hostname', '0.0.0.0', '--port', '3000'],
    {
      NEXT_PUBLIC_SANITY_DATASET: dataset,
      NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
      NEXT_PUBLIC_SANITY_STUDIO_URL: studioOrigin,
      NEXT_E2E_WEBPACK: 'true',
      SANITY_API_READ_TOKEN: token,
    },
  )
  const studio = startServer(
    'Sanity Studio',
    studioDirectory,
    ['sanity', 'dev', '--host', 'localhost', '--port', studioPort],
    {
      SANITY_STUDIO_DATASET: dataset,
      SANITY_STUDIO_PROJECT_ID: projectId,
      SANITY_STUDIO_PREVIEW_ORIGIN: appOrigin,
      SANITY_STUDIO_PREVIEW_PATH: '/open-preview',
    },
  )
  const stop = () => {
    stopServer(app)
    stopServer(studio)
  }

  try {
    await Promise.all([
      waitForServer(app, `${appOrigin}/open-preview`),
      waitForServer(studio, studioOrigin),
    ])
  } catch (error) {
    stop()
    throw error
  }

  return stop
}
