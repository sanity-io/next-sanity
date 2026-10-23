import {spawnSync} from 'node:child_process'
import {readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

const workspaceConfigPath = fileURLToPath(new URL('../pnpm-workspace.yaml', import.meta.url))
const storeDirectory = fileURLToPath(new URL('../node_modules/.pnpm/', import.meta.url))
const nextBuildDirectory = fileURLToPath(new URL('../apps/mvp/.next/', import.meta.url))
const packageSpec = process.argv[2]

/**
 * pkg.pr.new builds all report the same semver, so webpack happily bundles two
 * of them at once and the Studio dies on `Duplicate instances of context
 * "sanity/_singletons/…" with incompatible versions`. Drop previously installed
 * Studio copies and the app's build cache before installing the selected one.
 */
function removeStaleStudioBuilds() {
  rmSync(nextBuildDirectory, {force: true, recursive: true})

  let entries = []
  try {
    entries = readdirSync(storeDirectory)
  } catch {
    return
  }

  for (const entry of entries) {
    if (/^sanity@https?/.test(entry)) {
      rmSync(join(storeDirectory, entry), {force: true, recursive: true})
    }
  }
}

if (!packageSpec) {
  throw new Error(
    'Pass the Studio package version or pkg.pr.new URL, for example: ' +
      'pnpm test:e2e:install-studio 6.12.0',
  )
}

const originalConfig = readFileSync(workspaceConfigPath, 'utf8')
const selectedConfig = originalConfig.replace(
  /^  sanity: next$/m,
  `  sanity: '${packageSpec.replaceAll("'", "''")}'`,
)

if (selectedConfig === originalConfig) {
  throw new Error('Could not find the sanity override in pnpm-workspace.yaml')
}

const pnpmCli = process.env['npm_execpath']
if (!pnpmCli) {
  throw new Error('Run this script through pnpm')
}

try {
  writeFileSync(workspaceConfigPath, selectedConfig)
  removeStaleStudioBuilds()
  const result = spawnSync(process.execPath, [pnpmCli, 'install', '--lockfile=false', '--force'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`pnpm install exited with status ${result.status}`)
  }
} finally {
  writeFileSync(workspaceConfigPath, originalConfig)
}
