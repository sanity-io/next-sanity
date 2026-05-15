import type {QueryParams} from '@sanity/client'
import {prerender} from 'react-dom/static'

import type {LivePerspective} from '#live/types'

export const projectId = 'pv8y60vp'
export const dataset = 'production'
export const apiVersion = '2026-05-12'
export const stega = {studioUrl: '/studio'}

export type SseMockTags =
  | 'mock.sends-live-event'
  | 'mock.sends-restart-event'
  | 'mock.sends-goaway-event'
  | 'mock.sends-stream-error-event'
  | 'mock.closes-after-welcome'
  | 'mock.fails-with-500'
  | 'mock.aborts-connection'

export async function renderToString(app: React.JSX.Element) {
  const {prelude} = await prerender(app)

  const reader = prelude.getReader()
  let content = ''
  while (true) {
    // oxlint-disable-next-line no-await-in-loop
    const {done, value} = await reader.read()
    if (done) {
      return content
    }
    content += Buffer.from(value).toString('utf8')
  }
}

// Queries that are handled by the msw in setupMocks.ts
interface SanityFetchMocks {
  '{"perspective": $perspective, "useCdn": $useCdn}': {useCdn: boolean; perspective: string}
  '{"resultSourceMap": $resultSourceMap}': {resultSourceMap: boolean | 'withKeyArraySelector'}
  '{"cacheMode": $cacheMode}': {cacheMode: 'noStale' | undefined}
  '{"perspective": $perspective, "token": $token}': {
    perspective: LivePerspective
    token: string | null
  }
  '{"stega": $stega}': {stega: boolean}
}
export const getSanityFetchMock = <Query extends keyof SanityFetchMocks>(
  query: Query,
  params: SanityFetchMocks[Query],
) => {
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {query, params: params as unknown as QueryParams}
}
export type SanityMockQueries = keyof SanityFetchMocks
