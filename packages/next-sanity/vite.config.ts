import tsconfigPaths from 'vite-tsconfig-paths'
import {configDefaults, defineConfig} from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // don't use vitest to run Bun and Deno tests
    exclude: [...configDefaults.exclude, 'test.cjs', 'test.mjs'],
    // Enable rich PR failed test annotation on the CI
    // eslint-disable-next-line no-process-env
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', new GithubActionsReporter()] : 'default',
  },
})
