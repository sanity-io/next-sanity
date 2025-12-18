import react from '@vitejs/plugin-react'
import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react({})],
  test: {
    server: {deps: {inline: ['vitest-package-exports']}},
    projects: [
      {
        extends: true,
        ssr: {resolve: {conditions: ['next-js']}},
        test: {
          name: 'live-cache-components',
          typecheck: {enabled: true},
          exclude: [...configDefaults.exclude, 'test/**/*'],
        },
      },
      {
        extends: true,
        ssr: {resolve: {conditions: ['react-server']}},
        test: {
          name: 'live-server-components',
          typecheck: {enabled: true},
          exclude: [...configDefaults.exclude, 'test/**/*'],
        },
      },
      {
        extends: true,
        test: {
          name: 'live-client-components',
          typecheck: {enabled: true},
          exclude: [...configDefaults.exclude, 'test/**/*'],
        },
      },
      {
        extends: true,
        test: {name: 'integration-tests', exclude: [...configDefaults.exclude, 'src/live/**/*']},
      },
    ],
  },
})
