import 'server-only'

import {defineLive} from 'next-sanity'

import {client} from './sanity.client'

const token = process.env.SANITY_API_READ_TOKEN!

export const {sanityFetch, SanityLive, verifyPreviewSecret} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
