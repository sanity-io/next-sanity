import {defineLive} from 'next-sanity'

import {client} from '@/app/sanity.client'

const token = process.env.SANITY_API_READ_TOKEN!

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
