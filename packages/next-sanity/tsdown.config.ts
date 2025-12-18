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
    './src/experimental/client-components/live.tsx',
    './src/index.ts',
    './src/live.tsx',
    './src/live.next-js.tsx',
    './src/live.react-server.tsx',
    './src/live/client-components/live/index.ts',
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
      pkg['./live'] = {
        'next-js': pkg['./live.next-js'],
        'react-server': pkg['./live.react-server'],
        'default': pkg['./live'],
      }
      delete pkg['./live.react-server']
      delete pkg['./live.next-js']
      return pkg
    },
  },
  inputOptions: {preserveEntrySignatures: 'strict', experimental: {attachDebugInfo: 'none'}},
  outputOptions: {hoistTransitiveImports: false},
  platform: 'neutral',
  minify: 'dce-only',
  ignoreWatch: ['.turbo'],
})
