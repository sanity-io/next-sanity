import {http, HttpResponse} from 'msw'
import {sse} from 'msw'
import {setupWorker} from 'msw/browser'

const accessControlExposeHeaders =
  'ETag, X-Sanity-Deprecated, X-Sanity-Warning, X-Sanity-Shard, traceparent'
const accessControlMaxAge = '600'

let id = 0
const getEventId = () => {
  id++
  return `M${id}`
}

// This file sets up the worker, and all the happy path handlers as well as special cases that trigger based on specific request tags

export type SseMockTags = 'mock.sends-live-event'

export const worker = setupWorker(
  http.options(
    'https://*.api.sanity.io/:apiVersion/data/live/events/:dataset',
    () =>
      new HttpResponse(null, {
        status: 204,
        headers: {
          'access-control-allow-credentials': 'true',
          'access-control-allow-headers': 'authorization',
          'access-control-allow-methods': 'GET',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': accessControlExposeHeaders,
          'access-control-max-age': accessControlMaxAge,
          'cache-control': 'public, max-age=15',
          'content-length': '0',
        },
      }),
  ),
  sse<{welcome: Record<string, never>; message: {tags: string[]}}>(
    'https://*.api.sanity.io/:apiVersion/data/live/events/:dataset',
    ({client, request}) => {
      const {searchParams} = new URL(request.url)
      const includeDrafts = searchParams.get('includeDrafts') === 'true'
      const tag = searchParams.get('tag')
      const waitFor = searchParams.get('waitFor') === 'function' ? 'function' : undefined
      // oxlint-disable-next-line no-console
      console.log({includeDrafts, tag, waitFor})

      client.send({id: getEventId(), event: 'welcome', data: {}})

      // oxlint-disable-next-line no-unsafe-type-assertion
      switch (tag as SseMockTags) {
        case 'mock.sends-live-event': {
          client.send({
            id: getEventId(),
            event: 'message',
            data: {tags: ['s1:01cWIQ', 's1:57Y4Uw', 's1:EiHmwQ']},
          })
        }
      }
    },
  ),
)
