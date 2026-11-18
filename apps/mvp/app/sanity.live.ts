import {defineLive} from 'next-sanity/live'
import {perspective} from 'next/root-params'

import {client} from '@/app/sanity.client'

const token = process.env.SANITY_API_READ_TOKEN!

export const {sanityFetch, sanityFetchMetadata, SanityLive} = defineLive({
  client,
  serverToken: token,
  // TODO: setup experimental_taintUniqueValue here
  browserToken: process.env.NEXT_PUBLIC_SANITY_API_BROWSER_TOKEN || token,
  perspective,
})
