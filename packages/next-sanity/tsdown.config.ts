import {defineConfig, type Format} from 'tsdown'

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
  external: [
    'next-sanity',
    'next-sanity/experimental/client-components/live',
    'next-sanity/live/client-components/live',
    'next-sanity/live/client-components/live-stream',
    'next-sanity/live/server-actions',
    'next-sanity/studio/client-component',
    'next-sanity/visual-editing/client-component',
    'next-sanity/visual-editing/server-actions',
  ],
  sourcemap: true,
  hash: false,
  exports: {
    customExports(pkg) {
      pkg['./live'] = {
        'react-server': pkg['./live'],
        'default': pkg['./live.server-only'],
      }
      delete pkg['./live.server-only']
      return pkg
    },
  },
  inputOptions: {preserveEntrySignatures: 'strict'},
  outputOptions: {
    hoistTransitiveImports: false,
    banner(ctx) {
      if (ctx.isEntry || ctx.name === 'experimental/live') {
        return 'import "server-only";'
      }

      return ''
    },
  },
  platform: 'neutral',
  minify: 'dce-only',
  ignoreWatch: ['.turbo'],
})
