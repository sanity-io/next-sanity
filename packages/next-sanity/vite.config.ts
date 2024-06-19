import {configDefaults, defineConfig} from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

import pkg from './package.json'

export default defineConfig({
  test: {
    // don't use vitest to run Bun and Deno tests
    exclude: [...configDefaults.exclude, 'test.cjs', 'test.mjs'],
    // Enable rich PR failed test annotation on the CI
    // eslint-disable-next-line no-process-env
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', new GithubActionsReporter()] : 'default',
    // Allow switching test runs from using the source TS or compiled ESM
    alias: {'next-sanity': pkg.exports['.'].source},
  },
})
