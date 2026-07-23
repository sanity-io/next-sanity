import {createClient, variantsApiVersion} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: variantsApiVersion,
  useCdn: false,
  perspective: 'published',
  resultSourceMap: 'withKeyArraySelector',
  stega: {
    studioUrl: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}/studio#`,
  },
})

export type {QueryOptions, QueryParams} from 'next-sanity'
