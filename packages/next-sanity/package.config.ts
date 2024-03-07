import {defineConfig} from '@sanity/pkg-utils'

const MODULE_PATHS_WHICH_USE_CLIENT_DIRECTIVE_SHOULD_BE_ADDED = [
  'NextStudio.tsx',
  'VisualEditing.tsx',
  'imageLoader.ts',
]

const MODULE_PATHS_WHICH_USE_SERVER_DIRECTIVE_SHOULD_BE_ADDED = ['actions.ts']

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  minify: true,
  rollup: {
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
        if (
          MODULE_PATHS_WHICH_USE_SERVER_DIRECTIVE_SHOULD_BE_ADDED.find((modulePath) =>
            chunkInfo.facadeModuleId?.endsWith(modulePath),
          )
        ) {
          return `"use server"`
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
