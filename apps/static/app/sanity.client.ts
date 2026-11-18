import {createClient, variantsApiVersion} from 'next-sanity'

export const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: variantsApiVersion,
  useCdn: false,
  perspective: 'published',
  resultSourceMap: 'withKeyArraySelector',
  stega: {
    enabled: true,
    studioUrl,
    logger: console,
  },
})

export type {QueryOptions, QueryParams} from 'next-sanity'
