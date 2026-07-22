import {createClient} from 'next-sanity'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from 'sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion,
  useCdn: false,
  perspective: 'published',
  resultSourceMap: 'withKeyArraySelector',
  stega: {
    enabled: true,
    studioUrl: '/studio/#',
    logger: console,
  },
})

export type {QueryOptions, QueryParams} from 'next-sanity'
