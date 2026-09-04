import type {MetadataRoute} from 'next'
import {defineQuery} from 'next-sanity'

import {sanityFetchMetadata} from '@/app/sanity.live'

const postSlugsQuery = defineQuery(
  `*[_type == "post" && defined(slug.current)]{"slug": slug.current, _updatedAt}`,
)

// Metadata routes cannot read root params, so the perspective is passed explicitly.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {data} = await sanityFetchMetadata({query: postSlugsQuery, perspective: 'published'})
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return data.map((post) => ({url: `${origin}/${post.slug}`, lastModified: post._updatedAt}))
}
