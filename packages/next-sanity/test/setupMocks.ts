import {http, HttpResponse, passthrough} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll} from 'vitest'

function validateQuery(
  searchParams: URLSearchParams,
  useCdn: boolean,
): HttpResponse<any> | undefined {
  switch (searchParams.get('query')) {
    case '{"perspective": $perspective, "useCdn": $useCdn}': {
      return mockResponse({useCdn, perspective: searchParams.get('perspective')})
    }
  }
  return undefined
}

function mockResponse(data: unknown) {
  return HttpResponse.json({result: data, resultSourceMap: null, syncTags: ['A']})
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
