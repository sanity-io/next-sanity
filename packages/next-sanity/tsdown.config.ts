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
    './src/studio/client-component/index.ts',
    './src/studio/index.ts',
    './src/visual-editing/client-component/index.ts',
    './src/visual-editing/index.ts',
    './src/visual-editing/server-actions/index.ts',
    './src/webhook/index.ts',
  ],
  external: [
    'next-sanity/studio/client-component',
    'next-sanity/visual-editing/client-component',
    'next-sanity/visual-editing/server-actions',
  ],
  sourcemap: true,
  hash: false,
  exports: true,
  platform: 'neutral',
  minify: 'dce-only',
  ignoreWatch: ['.turbo'],
})
