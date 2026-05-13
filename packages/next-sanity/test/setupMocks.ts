import {http, HttpResponse, passthrough} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll} from 'vitest'

import type {SanityMockQueries} from './helpers'

function validateQuery(
  searchParams: URLSearchParams,
  useCdn: boolean,
): HttpResponse<any> | undefined {
  if (searchParams.get('tag')?.endsWith('fetch-sync-tags')) {
    if (searchParams.get('returnQuery') !== 'false') {
      return mockErrorResponse('returnQuery must be false for fetch-sync-tags requests')
    }
    if (searchParams.has('resultSourceMap')) {
      return mockErrorResponse('resultSourceMap should never be set for fetch-sync-tags requests')
    }
  }

  // oxlint-disable-next-line no-unsafe-type-assertion
  const query = searchParams.get('query') as SanityMockQueries
  switch (query) {
    case '{"perspective": $perspective, "useCdn": $useCdn}': {
      return mockResponse({useCdn, perspective: searchParams.get('perspective')})
    }
    case '{"resultSourceMap": $resultSourceMap}': {
      const resultSourceMap = searchParams.get('resultSourceMap')
      return mockResponse({resultSourceMap: resultSourceMap === 'true' ? true : resultSourceMap})
    }
    default: {
      const exhaustiveCheck: never = query
      // oxlint-disable-next-line no-unsafe-type-assertion
      return mockErrorResponse(`Unhandled query: ${exhaustiveCheck as any}`)
    }
  }
}

function mockResponse(data: unknown) {
  return HttpResponse.json({result: data, resultSourceMap: null, syncTags: ['A']})
}
function mockErrorResponse(description: string) {
  return HttpResponse.json({error: {description, type: 'httpBadRequest'}}, {status: 400})
}

export const restHandlers = [
  // useCdn: true
  http.get('https://pv8y60vp.apicdn.sanity.io/:apiVersion/data/query/:dataset', ({request}) => {
    const {searchParams} = new URL(request.url)

    const returns = validateQuery(searchParams, true)
    if (returns) return returns

    return passthrough()
  }),
  // useCdn: false
  http.get('https://pv8y60vp.api.sanity.io/:apiVersion/data/query/:dataset', ({request}) => {
    const {searchParams} = new URL(request.url)

    const returns = validateQuery(searchParams, false)
    if (returns) return returns

    return passthrough()
  }),
]

const server = setupServer(...restHandlers)

// Start server before all tests
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))

// Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers())
