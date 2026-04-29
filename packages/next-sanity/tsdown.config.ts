import {defineConfig} from 'tsdown'

/**
 * Testing out tsdown, if it works well we'll move it to `@sanity/pkg-utils`
 */

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: [
    './src/draft-mode/index.ts',
    './src/hooks/index.ts',
    './src/image/index.ts',
    './src/index.ts',
    './src/live.ts',
    './src/live.server-only.ts',
    './src/live/client-components/live/index.ts',
    './src/live/client-components/live-stream/index.ts',
    './src/live/server-actions/index.ts',
    './src/studio/client-component/index.ts',
    './src/studio/index.ts',
    './src/visual-editing/client-component/index.ts',
    './src/visual-editing/index.ts',
    './src/visual-editing/server-actions/index.ts',
    './src/webhook/index.ts',
  ],
  /**
   * Workaround for https://github.com/rolldown/tsdown/issues/888
   * tsdown's DepsPlugin rewrites bare import specifiers like `next/headers` to
   * `next/headers.js` for packages without a `package.json` `exports` field.
   * This breaks Turbopack's module resolution in Next.js app-route handlers.
   * A pre-order resolveId hook preserves the original bare specifiers.
   */
  plugins: [
    {
      name: 'preserve-bare-imports',
      resolveId: {
        order: 'pre',
        handler(id, _importer, extraOptions) {
          if (extraOptions.isEntry) return
          if (/^next\//.test(id)) {
            return {id, external: true}
          }
        },
      },
    },
  ],
  external: [/^next-sanity(?:\/|$)/],
  sourcemap: true,
  hash: false,
  exports: {
    enabled: 'local-only',
    devExports: true,
    customExports(pkg) {
      delete pkg['./package.json']

      pkg['./live'] = {
        'react-server': pkg['./live'],
        'default': pkg['./live.server-only'],
      }
      delete pkg['./live.server-only']

      const sortedPkg = {} as typeof pkg
      Object.keys(pkg)
        .toSorted()
        .forEach((key) => {
          sortedPkg[key] = pkg[key]
        })

      // Append package.json at the end
      sortedPkg['./package.json'] = './package.json'

      return sortedPkg
    },
  },
  inputOptions: {preserveEntrySignatures: 'strict', experimental: {attachDebugInfo: 'none'}},
  outputOptions: {hoistTransitiveImports: false},
  platform: 'neutral',
  minify: 'dce-only',
  ignoreWatch: ['.turbo'],
})
