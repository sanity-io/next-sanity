import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

const workspaceConfigPath = fileURLToPath(new URL('../pnpm-workspace.yaml', import.meta.url))
const packageSpec = process.argv[2]

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
