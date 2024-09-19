import {defineLive} from 'next-sanity'

import {client} from './sanity.client'
import {token} from './sanity.fetch'

export const {sanityFetch, SanityLive, verifyPreviewSecret} = defineLive({
  client,
  previewDraftsToken: token,
  liveDraftsToken: token,
})
