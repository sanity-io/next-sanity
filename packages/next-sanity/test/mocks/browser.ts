import {http, HttpResponse, sse} from 'msw'
import {setupWorker} from 'msw/browser'

import type {SseMockTags} from '../helpers'

const accessControlExposeHeaders =
  'ETag, X-Sanity-Deprecated, X-Sanity-Warning, X-Sanity-Shard, traceparent'
const accessControlMaxAge = '600'

const corsHeaders = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'authorization',
  'access-control-allow-methods': 'GET',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': accessControlExposeHeaders,
  'access-control-max-age': accessControlMaxAge,
  'cache-control': 'public, max-age=15',
  'content-length': '0',
}

let id = 0
const getEventId = () => {
  id++
  return `M${id}`
}

export const worker = setupWorker(
  http.options(
    'https://*.api.sanity.io/:apiVersion/data/live/events/:dataset',
    () => new HttpResponse(null, {status: 204, headers: corsHeaders}),
  ),
  // Must come before the `sse()` handler so the 500 short-circuit wins for the
  // matching tag. Returning `undefined` lets MSW fall through to the SSE
  // handler for every other request.
  http.get('https://*.api.sanity.io/:apiVersion/data/live/events/:dataset', ({request}) => {
    const {searchParams} = new URL(request.url)
    const tag = searchParams.get('tag')
    // oxlint-disable-next-line no-unsafe-type-assertion
    if ((tag as SseMockTags) === 'mock.fails-with-500') {
      return new HttpResponse(null, {
        status: 500,
        headers: {'access-control-allow-origin': '*'},
      })
    }
    return undefined
  }),
  sse<{
    welcome: Record<string, never>
    message: {tags: string[]}
    restart: Record<string, never>
    goaway: {reason: string}
    error: {status: number; message: string}
  }>('https://*.api.sanity.io/:apiVersion/data/live/events/:dataset', ({client, request}) => {
    const {searchParams} = new URL(request.url)
    const tag = searchParams.get('tag')

    client.send({id: getEventId(), event: 'welcome', data: {}})

    // oxlint-disable-next-line no-unsafe-type-assertion
    switch (tag as SseMockTags) {
      case 'mock.sends-live-event': {
        client.send({
          id: getEventId(),
          event: 'message',
          data: {tags: ['s1:01cWIQ', 's1:57Y4Uw', 's1:EiHmwQ']},
        })
        break
      }
      case 'mock.sends-restart-event': {
        client.send({id: getEventId(), event: 'restart', data: {}})
        break
      }
      case 'mock.sends-goaway-event': {
        client.send({
          id: getEventId(),
          event: 'goaway',
          data: {reason: 'connection limit reached'},
        })
        break
      }
      case 'mock.sends-stream-error-event': {
        client.send({
          event: 'error',
          data: {status: 500, message: 'Unfortunate error'},
        })
        client.close()
        break
      }
      case 'mock.closes-after-welcome': {
        setTimeout(() => client.close(), 50)
        break
      }
      case 'mock.aborts-connection': {
        setTimeout(() => client.error(), 50)
        break
      }
      case 'mock.fails-with-500': {
        // Handled by the 500 handler above; the SSE handler is unreachable
        // for this tag but is listed here to satisfy the exhaustiveness check.
        break
      }
    }
  }),
)
