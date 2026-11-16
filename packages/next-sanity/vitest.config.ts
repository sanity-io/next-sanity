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
        // Serves the MSW service worker at `/mockServiceWorker.js`.
        publicDir: 'test/public',
        resolve: {
          alias: {
            // The interop hack `next/image` uses to flatten its CommonJS
            // default export confuses vite's dependency optimizer, which
            // resolves the default import to the exports object instead of
            // the component. Point the browser tests at the ESM build that
            // Next.js bundlers use instead (see test/setupBrowser.ts for the
            // globals that build expects).
            'next/image': 'next/dist/esm/shared/lib/image-external.js',
          },
        },
        test: {
          exclude: [...defaultExclude, openPreviewTestFile],
          include: [browserTestFiles],
          setupFiles: ['./test/setupBrowser.ts'],
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
