import url from '@rollup/plugin-url'
import {defineConfig} from '@sanity/pkg-utils'
import path from 'path'

export default defineConfig({
  minify: false,

  rollup: {
    plugins: [
      url({
        fileName: '[dirname][hash][extname]',
        sourceDir: path.join(__dirname, 'src'),
        include: ['**/*.ico', '**/*.svg', '**/*.png', '**/*.jp(e)?g', '**/*.gif', '**/*.webp'],
      }),
    ],
  },
})
