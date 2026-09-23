import react from '@vitejs/plugin-react'
import {playwright} from '@vitest/browser-playwright'
import {defineConfig, defaultExclude} from 'vitest/config'

import {runOpenPreview} from './test/open-preview/command.ts'

const browserTestFiles = 'test/**/*.browser.{test,spec}.{ts,tsx}'
const openPreviewTestFile = 'test/OpenPreview.browser.test.ts'

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
          exclude: [...defaultExclude, openPreviewTestFile],
          include: [browserTestFiles],
          name: 'browser',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{browser: 'chromium'}],
          },
        },
      },
      {
        test: {
          globalSetup: ['./test/open-preview/globalSetup.ts'],
          include: [openPreviewTestFile],
          name: 'open-preview',
          browser: {
            commands: {runOpenPreview},
            enabled: true,
            provider: playwright(),
            instances: [{browser: 'chromium'}],
          },
        },
      },
    ],
  },
})
