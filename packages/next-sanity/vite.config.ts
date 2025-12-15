import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // don't use vitest to run Bun and Deno tests
    exclude: [...configDefaults.exclude, 'test.cjs', 'test.mjs'],
  },
})
