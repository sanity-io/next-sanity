import terser from '@rollup/plugin-terser'
import {defineConfig} from '@sanity/pkg-utils'

const MODULE_PATHES_WHICH_USE_CLIENT_DIRECTIVE_SHOULD_BE_ADDED = ['NextStudioLoading.tsx']

import url from '@rollup/plugin-url'
import path from 'path'

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  // Overriding the minify logiic in order to disable `compress: {directives: false}`
  minify: false,
  rollup: {
    plugins: [
      url({
        fileName: '[dirname][hash][extname]',
        sourceDir: path.join(__dirname, 'src'),
        include: ['**/*.ico', '**/*.svg', '**/*.png'],
      }),
      terser({
        compress: {directives: false},
        output: {
          comments: (_node, comment) => {
            const text = comment.value
            const type = comment.type

            // Check if this is a multiline comment
            if (type == 'comment2') {
              // Keep licensing comments
              return /@preserve|@license|@cc_on/i.test(text)
            }

            return false
          },
        },
      }),
    ],
    output: {
      preserveModules: true,
      preserveModulesRoot: 'src',
      banner: (chunkInfo) => {
        if (
          MODULE_PATHES_WHICH_USE_CLIENT_DIRECTIVE_SHOULD_BE_ADDED.find(
            (modulePath) => chunkInfo.facadeModuleId?.endsWith(modulePath),
          )
        ) {
          return `"use client"`
        }
        return ''
      },
    },
  },
  extract: {
    rules: {
      'ae-forgotten-export': 'error',
      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'warn',
    },
  },
})
