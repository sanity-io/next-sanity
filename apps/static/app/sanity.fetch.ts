import {client, type QueryParams} from './sanity.client'

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
