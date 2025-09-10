/* eslint-disable no-console */
import path from 'node:path'

import {defineConfig} from '@sanity/pkg-utils'

const MODULE_PATHS_WHICH_USE_CLIENT_DIRECTIVE_SHOULD_BE_ADDED = [
  path.join('src', 'image', 'index.ts'),
  path.join('src', 'studio', 'client-component', 'index.ts'),
  path.join('src', 'visual-editing', 'client-component', 'index.ts'),
]

const MODULE_PATHS_WHICH_USE_SERVER_DIRECTIVE_SHOULD_BE_ADDED = [
  path.join('src', 'visual-editing', 'server-actions', 'index.ts'),
]

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  rollup: {
    output: {
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
    treeshake: {
      // @TODO this is necessary for now https://github.com/sanity-io/pkg-utils/pull/1922
      moduleSideEffects: true,
    },
  },
  extract: {
    rules: {
      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'warn',
    },
  },
})
