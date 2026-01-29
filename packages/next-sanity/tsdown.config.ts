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
    './src/experimental/live.tsx',
    './src/experimental/client-components/live.tsx',
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
