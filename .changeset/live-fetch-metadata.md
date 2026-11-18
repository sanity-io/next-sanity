---
"next-sanity": minor
---

`defineLive` now returns `sanityFetchMetadata` next to `sanityFetch` and `<SanityLive />`, in all three export conditions.

`sanityFetchMetadata` is `sanityFetch` with `stega` fixed to `false`. Its `data` keeps the clean TypeGen / `ClientReturn` type, and `stega` is not an accepted option. `perspective` is optional and follows the same default rule as `sanityFetch`: `published` outside draft mode, and inside draft mode the `perspective` resolver handed to `defineLive`, else the Presentation Tool cookie without Cache Components or `drafts` with them. An explicit `perspective` always wins. The new `DefinedFetchMetadataType` types it.

With Cache Components the library owns the `'use cache'` boundary inside `sanityFetchMetadata`, so `generateMetadata` calls it directly. Metadata routes such as `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` cannot read root params, so pass `perspective: 'published'` there and the resolver is never called.

Before:

```ts
// sanity/live.ts
export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken,
  browserToken,
  perspective,
})

export const sanityFetchMetadata: DefinedFetchType = async (options) => {
  "use cache"
  return sanityFetch({...options, stega: false})
}
```

After:

```ts
// sanity/live.ts
export const {sanityFetch, sanityFetchMetadata, SanityLive} = defineLive({
  client,
  serverToken,
  browserToken,
  perspective,
})
```

```tsx
// app/[perspective]/[slug]/page.tsx
export async function generateMetadata({params}: PageProps<"/[perspective]/[slug]">) {
  const {slug} = await params
  const {data} = await sanityFetchMetadata({query: POST_QUERY, params: {slug}})
  return {title: data?.title}
}
```

```ts
// app/sitemap.ts
export default async function sitemap() {
  const {data} = await sanityFetchMetadata({query: POST_SLUGS_QUERY, perspective: "published"})
  return data.map((post) => ({url: `https://example.com/${post.slug}`}))
}
```
