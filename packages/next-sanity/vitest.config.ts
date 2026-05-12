import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react({})],
  test: {
    setupFiles: ['./test/setupMocks.ts'],
    server: {deps: {inline: ['vitest-package-exports']}},
  },
})
