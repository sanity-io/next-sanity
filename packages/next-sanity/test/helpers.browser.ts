import {test as testBase} from 'vitest'

import {worker} from './mocks/browser'

export const test = testBase.extend({
  worker: [
    // oxlint-disable-next-line no-empty-pattern
    async ({}, next) => {
      await worker.start({onUnhandledRequest: 'error', quiet: true})
      await next(worker)
      worker.stop()
    },
    {
      auto: true,
    },
  ],
})
