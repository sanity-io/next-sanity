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
  },
  extract: {
    rules: {
      'ae-forgotten-export': 'error',
      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'warn',
    },
  },

  reactCompilerOptions: {
    logger: {
      logEvent(filename, event) {
        if (event.kind === 'CompileError') {
          console.group(`[${filename}] ${event.kind}`)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const {reason, description, severity, loc, suggestions} = event.detail as any
          console.error(`[${severity}] ${reason}`)
          console.log(`${filename}:${loc.start?.line}:${loc.start?.column} ${description}`)
          console.log(suggestions)

          console.groupEnd()
        }
      },
    },
  },
})
