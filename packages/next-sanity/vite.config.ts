import tsconfigPaths from 'vite-tsconfig-paths'
import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // don't use vitest to run Bun and Deno tests
    exclude: [...configDefaults.exclude, 'test.cjs', 'test.mjs'],
  },
})
