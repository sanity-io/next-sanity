import react from '@vitejs/plugin-react'
import {playwright} from '@vitest/browser-playwright'
import {defineConfig, defaultExclude} from 'vitest/config'

const browserTestFiles = 'test/**/*.browser.{test,spec}.tsx'

export default defineConfig({
  plugins: [react({})],
  test: {
    projects: [
      {
        test: {
          exclude: [...defaultExclude, browserTestFiles],
          setupFiles: ['./test/setupMocks.ts'],
          server: {deps: {inline: ['vitest-package-exports']}},
          name: 'unit',
          environment: 'node',
        },
      },
      {
        test: {
          include: [browserTestFiles],
          name: 'browser',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{browser: 'chromium'}],
          },
        },
      },
    ],
  },
})
