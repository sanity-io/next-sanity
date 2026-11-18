import type {SyncTagInvalidateContext} from '@sanity/functions'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {defineInvalidateSyncTagsHandler, invalidateSyncTags} from '../src'

const secret = 'test-secret'
const syncTags = ['s1:abc', 's1:def']
const urlA = 'https://a.example.com/api/revalidate'
const urlB = 'https://b.example.com/api/revalidate'

function respondWith(handler: (request: Request) => Response | Promise<Response>) {
  const requests: Request[] = []
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init)
    requests.push(request)
    return handler(request)
  })
  return Object.assign(fetch, {requests})
}

// oxlint-disable-next-line no-unsafe-type-assertion
const context = {} as SyncTagInvalidateContext

afterEach(() => {
  vi.restoreAllMocks()
})

describe('invalidateSyncTags', () => {
  test('signs the body and POSTs to every URL in parallel', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const fetch = respondWith(async () => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 20))
      inFlight -= 1
      return new Response(null, {status: 200})
    })

    const deliveries = await invalidateSyncTags(syncTags, {secret, urls: [urlA, urlB], fetch})

    expect(deliveries).toEqual([
      {url: urlA, ok: true, status: 200},
      {url: urlB, ok: true, status: 200},
    ])
    expect(maxInFlight).toBe(2)

    expect(fetch.requests.map((request) => request.url)).toEqual([urlA, urlB])
    const bodies = await Promise.all(fetch.requests.map((request) => request.text()))
    const verified = await Promise.all(
      fetch.requests.map((request, i) => {
        expect(request.method).toBe('POST')
        expect(request.headers.get('content-type')).toBe('application/json')
        expect(request.headers.get(SIGNATURE_HEADER_NAME)).toMatch(/^t=\d+,v1=/)
        expect(bodies[i]).toBe(JSON.stringify({syncTags}))
        return isValidSignature(bodies[i], request.headers.get(SIGNATURE_HEADER_NAME)!, secret)
      }),
    )
    expect(verified).toEqual([true, true])
  })

  test('splits a comma separated urls string', async () => {
    const fetch = respondWith(() => new Response(null, {status: 200}))

    const deliveries = await invalidateSyncTags(syncTags, {
      secret,
      urls: ` ${urlA}, ${urlB} ,`,
      fetch,
    })

    expect(deliveries.map((delivery) => delivery.url)).toEqual([urlA, urlB])
  })

  test('reports one failed origin without affecting the others', async () => {
    const fetch = respondWith((request) =>
      request.url === urlA
        ? new Response('boom', {status: 500})
        : new Response(null, {status: 200}),
    )

    const deliveries = await invalidateSyncTags(syncTags, {secret, urls: [urlA, urlB], fetch})

    expect(deliveries).toEqual([
      {url: urlA, ok: false, status: 500, error: 'boom'},
      {url: urlB, ok: true, status: 200},
    ])
  })

  test('reports a network error as a failed delivery', async () => {
    const fetch = respondWith(() => {
      throw new TypeError('fetch failed')
    })

    const deliveries = await invalidateSyncTags(syncTags, {secret, urls: urlA, fetch})

    expect(deliveries).toEqual([
      {url: urlA, ok: false, status: undefined, error: 'TypeError: fetch failed'},
    ])
  })

  test('throws when the secret is missing', async () => {
    await expect(invalidateSyncTags(syncTags, {secret: undefined, urls: urlA})).rejects.toThrow(
      '`secret` is required',
    )
  })

  test.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['only commas', ' , '],
    ['empty array', []],
  ])('throws when urls is %s', async (_, urls) => {
    await expect(invalidateSyncTags(syncTags, {secret, urls})).rejects.toThrow(
      '`urls` must contain at least one URL',
    )
  })

  test('throws when a url does not parse', async () => {
    await expect(invalidateSyncTags(syncTags, {secret, urls: 'not a url'})).rejects.toThrow(
      'invalid URL: not a url',
    )
  })
})

describe('defineInvalidateSyncTagsHandler', () => {
  test('delivers, then calls done with the sync tags', async () => {
    const fetch = respondWith(() => new Response(null, {status: 200}))
    const done = vi.fn(async () => new Response(null, {status: 200}))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const handler = defineInvalidateSyncTagsHandler({secret, urls: [urlA, urlB], fetch})

    await handler({context, event: {data: {syncTags}}, done})

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(done).toHaveBeenCalledExactlyOnceWith(syncTags)
    expect(log.mock.calls.map(([line]) => line)).toEqual([
      `Invalidated 2 sync tags at ${urlA}, HTTP 200`,
      `Invalidated 2 sync tags at ${urlB}, HTTP 200`,
    ])
  })

  test('logs a failed origin and still calls done', async () => {
    const fetch = respondWith((request) =>
      request.url === urlA
        ? new Response('Invalid signature', {status: 401})
        : new Response(null, {status: 200}),
    )
    const done = vi.fn(async () => new Response(null, {status: 200}))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = defineInvalidateSyncTagsHandler({secret, urls: [urlA, urlB], fetch})

    await handler({context, event: {data: {syncTags}}, done})

    expect(done).toHaveBeenCalledExactlyOnceWith(syncTags)
    expect(error).toHaveBeenCalledExactlyOnceWith(
      `Failed to invalidate sync tags at ${urlA}, HTTP 401: Invalid signature`,
    )
  })

  test('calls done even when the configuration is missing', async () => {
    const fetch = respondWith(() => new Response(null, {status: 200}))
    const done = vi.fn(async () => new Response(null, {status: 200}))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = defineInvalidateSyncTagsHandler({secret: undefined, urls: urlA, fetch})

    await expect(handler({context, event: {data: {syncTags}}, done})).resolves.toBeUndefined()

    expect(fetch).not.toHaveBeenCalled()
    expect(done).toHaveBeenCalledExactlyOnceWith(syncTags)
    expect(error.mock.calls[0]?.[0]).toBe(
      'Failed to invalidate sync tags, releasing the live event anyway',
    )
  })

  test('does not throw when done itself fails', async () => {
    const fetch = respondWith(() => new Response(null, {status: 200}))
    const done = vi.fn(async () => {
      throw new Error('sanity is down')
    })
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = defineInvalidateSyncTagsHandler({secret, urls: urlA, fetch})

    await expect(handler({context, event: {data: {syncTags}}, done})).resolves.toBeUndefined()

    expect(error.mock.calls[0]?.[0]).toBe('Failed to call done()')
  })

  test('logs a non-ok done response', async () => {
    const fetch = respondWith(() => new Response(null, {status: 200}))
    const done = vi.fn(async () => new Response(null, {status: 500}))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = defineInvalidateSyncTagsHandler({secret, urls: urlA, fetch})

    await handler({context, event: {data: {syncTags}}, done})

    expect(error).toHaveBeenCalledExactlyOnceWith('Sanity responded with HTTP 500 to done()')
  })
})
