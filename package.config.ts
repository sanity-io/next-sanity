import url from '@rollup/plugin-url'
import {defineConfig} from '@sanity/pkg-utils'
import path from 'path'

export default defineConfig({
  extract: {
    rules: {
      'ae-forgotten-export': 'warn',
      'ae-incompatible-release-tags': 'warn',
      'ae-missing-release-tag': 'warn',
    },
  },

  minify: false,

  rollup: {
    plugins: [
      url({
        fileName: '[dirname][hash][extname]',
        sourceDir: path.join(__dirname, 'src'),
        include: ['**/*.ico', '**/*.svg', '**/*.png'],
      }),
    ],
  },
})
