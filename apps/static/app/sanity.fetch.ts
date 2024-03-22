import 'server-only'

import type {QueryParams} from '@sanity/client'

import {client} from './sanity.client'

// eslint-disable-next-line no-process-env
export const token = process.env.SANITY_API_READ_TOKEN!

export function sanityFetch<QueryResponse>({
  query,
  params = {},
}: {
  query: string
  params?: QueryParams
}) {
  return client.fetch<QueryResponse>(query, params, {cache: 'no-store'})
}
