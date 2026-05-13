import react from '@vitejs/plugin-react'
import {defineConfig, defaultExclude} from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'


export default defineConfig({
  plugins: [react({})],
  test: {
    
    projects: [
      {
        test: {
          exclude: [...defaultExclude,'test/**/*.browser.{test,spec}.tsx',],
          setupFiles: ['./test/setupMocks.ts'],
    server: {deps: {inline: ['vitest-package-exports']}},
          name: 'unit',
          environment: 'node',
        }
      },
      {
        test: {
          include: [
            'test/**/*.browser.{test,spec}.tsx',
          ],
          name: 'browser',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              { browser: 'chromium' },
            ],
          },
        },
      },
    ]
  },
})
