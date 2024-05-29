import 'server-only'

import {defineSanityFetch} from 'next-sanity/live-subscription'

import {client} from './sanity.client'

// eslint-disable-next-line no-process-env
export const token = process.env.SANITY_API_READ_TOKEN

if (!token) {
  throw new Error('The `SANITY_API_READ_TOKEN` environment variable is required.')
}

export const sanityFetch = defineSanityFetch({
  client,
  searchParamKey: 'lastLiveEventId',
  draftMode: {token, perspective: 'previewDrafts', stega: true},
})
