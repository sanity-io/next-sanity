import 'server-only'

import type {QueryOptions, QueryParams} from '@sanity/client'
import {draftMode} from 'next/headers'

import {client} from './sanity.client'

// eslint-disable-next-line no-process-env
export const token = process.env.SANITY_API_READ_TOKEN!

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function sanityFetch<QueryResponse>({
  query,
  params = {},
  tags,
}: {
  query: string
  params?: QueryParams
  tags?: string[]
}) {
  const isDraftMode = draftMode().isEnabled
  if (isDraftMode && !token) {
    throw new Error('The `SANITY_API_READ_TOKEN` environment variable is required.')
  }

  return client.fetch<QueryResponse>(query, params, {
    ...(isDraftMode &&
      ({
        token,
        perspective: 'previewDrafts',
      } satisfies QueryOptions)),
    next: {
      revalidate: isDraftMode ? 0 : false,
      tags,
    },
  })
}
