/* eslint-disable no-process-env */
import {createClient} from 'src'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2022-11-11',
  useCdn: false,
  perspective: 'published',
  studioUrl: '/studio',
  logger: console,
})
