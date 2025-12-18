import {defineConfig} from 'tsdown'

/**
 * Testing out tsdown, if it works well we'll move it to `@sanity/pkg-utils`
 */

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: [
    './src/cache-life.ts',
    './src/draft-mode/index.ts',
    './src/hooks/index.ts',
    './src/image/index.ts',
    './src/index.ts',
    './src/live/client-components/index.ts',
    './src/live/conditions/default/index.ts',
    './src/live/conditions/next-js/index.ts',
    './src/live/conditions/react-server/index.ts',
    './src/live/server-actions/index.next-js.ts',
    './src/live/server-actions/index.default.ts',
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
        'next-js': pkg['./live/conditions/next-js'],
        'react-server': pkg['./live/conditions/react-server'],
        'default': pkg['./live/conditions/default'],
      }
      delete pkg['./live/conditions/default']
      delete pkg['./live/conditions/next-js']
      delete pkg['./live/conditions/react-server']

      pkg['./live/server-actions'] = {
        'next-js': pkg['./live/server-actions/index.next-js'],
        'default': pkg['./live/server-actions/index.default'],
      }
      delete pkg['./live/server-actions/index.next-js']
      delete pkg['./live/server-actions/index.default']

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
