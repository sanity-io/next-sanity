import terser from '@rollup/plugin-terser'
import {defineConfig} from '@sanity/pkg-utils'

const MODULE_PATHS_WHICH_USE_CLIENT_DIRECTIVE_SHOULD_BE_ADDED = [
  'NextStudio.tsx',
  'VisualEditing.tsx',
]

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  // Overriding the minify logiic in order to disable `compress: {directives: false}`
  minify: false,
  rollup: {
    plugins: [
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
          MODULE_PATHS_WHICH_USE_CLIENT_DIRECTIVE_SHOULD_BE_ADDED.find((modulePath) =>
            chunkInfo.facadeModuleId?.endsWith(modulePath),
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
