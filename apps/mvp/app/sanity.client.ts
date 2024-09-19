import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-22',
  useCdn: false,
  perspective: 'published',
  resultSourceMap: 'withKeyArraySelector',
  stega: {
    enabled: true,
    studioUrl: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/studio#`,
    // logger: console,
  },
})

export type {QueryOptions, QueryParams} from 'next-sanity'
