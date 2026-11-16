import type {SetupWorker} from 'msw/browser'
import {test as testBase} from 'vitest'

import {worker} from './mocks/browser'

export const test = testBase.extend<{worker: SetupWorker}>({
  worker: [
    // oxlint-disable-next-line no-empty-pattern
    async ({}, next) => {
      await worker.start({onUnhandledFrame: 'error', quiet: true})
      await next(worker)
      await worker.stop()
    },
    {
      auto: true,
    },
  ],
})
