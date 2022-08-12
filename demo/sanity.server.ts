/* eslint-disable no-process-env */
// Should only be used server-side/build-time

import type {SanityClient} from '@sanity/client'
import {createClient, groq} from 'src'

import {dataset, projectId} from './sanity.env'

export const sanityClient = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion: '2022-03-13',
})

export const previewClient = sanityClient.withConfig({
  token: process.env.SANITY_API_READ_TOKEN,
})

export const getClient = (preview: boolean): SanityClient =>
  preview ? previewClient : sanityClient

const postFields = groq`
  _id,
  title,
  "slug": slug.current,
  "author": author->{name, image},
  mainImage,
  publishedAt,
  body,
`
export const indexQuery = groq`
*[_type == "post"] | order(publishedAt desc, _updatedAt desc) {
  ${postFields}
}`

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function overlayDrafts(docs: any): any[] {
  const documents = docs || []
  const overlayed = documents.reduce((map: any, doc: any) => {
    if (!doc._id) {
      throw new Error('Ensure that `_id` is included in query projection')
    }

    const isDraft = doc._id.startsWith('drafts.')
    const id = isDraft ? doc._id.slice(7) : doc._id
    return isDraft || !map.has(id) ? map.set(id, doc) : map
  }, new Map())

  return Array.from(overlayed.values())
}
