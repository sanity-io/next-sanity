---
'next-sanity': minor
---

feat(image): accept Sanity image objects and asset ids as `src`. `<Image src={post.mainImage} projectId={projectId} dataset={dataset} alt="…" />` builds the CDN URL with `@sanity/image-url` 2.2, applies the crop set in the Studio, positions the crop around the hotspot when the requested aspect ratio differs, and uses `asset->metadata.lqip` for `placeholder="blur"` when no `blurDataURL` is given. `projectId` and `dataset` are read from the asset URL when the query dereferences it (`asset->{url}`). The new `queryParams` prop merges additional Sanity Image CDN params (e.g. `{blur: 50}`) into the image URL.

`src` accepts the TypeGen image shapes from `@sanity/image-url` (`SanityImageLike`, asset documents, and references). Missing crop and hotspot coordinates use that library's defaults. `InferImageValue`, `InferStrictImageValue`, and `isImageWithAsset` are re-exported from `next-sanity/image`, and the `Infer*` types also accept stega-branded query results.

`imageLoader` and `isImageWithAsset` are plain functions that can be called from Server Components, for example with `getImageProps` for art-directed `<picture>` elements. The `'use client'` boundary now sits on the `Image` component alone, via the new `next-sanity/image/client-component` entry point.
