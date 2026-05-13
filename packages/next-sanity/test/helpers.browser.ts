import {test as testBase} from 'vitest'

import {worker} from './mocks/browser'

export const test = testBase.extend({
  worker: [
    // oxlint-disable-next-line no-empty-pattern
    async ({}, next) => {
      // Start the worker before the test.
      await worker.start({onUnhandledRequest: 'error', quiet: true})

      // Expose the worker object on the test's context.
      await next(worker)

      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      worker.resetHandlers()
    },
    {
      auto: true,
    },
  ],
})
