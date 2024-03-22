import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2022-11-11',
  useCdn: false,
  perspective: 'published',
  resultSourceMap: 'withKeyArraySelector',
  stega: {
    enabled: true,
    studioUrl: '/studio/#',
    logger: console,
  },
})

export type {QueryOptions, QueryParams} from '@sanity/client'
