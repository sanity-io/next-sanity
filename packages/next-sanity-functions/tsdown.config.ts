import {defineConfig} from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: ['./src/index.ts'],
  sourcemap: true,
  hash: false,
  exports: {
    enabled: 'local-only',
    devExports: true,
    customExports(pkg) {
      pkg['./package.json'] = './package.json'
      return pkg
    },
  },
  platform: 'neutral',
  minify: 'dce-only',
  ignoreWatch: ['.turbo'],
})
