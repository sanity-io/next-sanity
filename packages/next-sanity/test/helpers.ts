import type {QueryParams} from '@sanity/client'
import {prerender} from 'react-dom/static'

export const projectId = 'pv8y60vp'
export const dataset = 'production'
export const apiVersion = '2026-05-12'
export const stega = {studioUrl: '/studio'}

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
  // Used to test that the expected `useCdn` and `perspective` options are resolved correctly
  '{"perspective": $perspective, "useCdn": $useCdn}': {useCdn: boolean; perspective: string}
}
export const getSanityFetchMock = <Query extends keyof SanityFetchMocks>(
  query: Query,
  params: SanityFetchMocks[Query],
) => {
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {query, params: params as unknown as QueryParams}
}
export type SanityMockQueries = keyof SanityFetchMocks
