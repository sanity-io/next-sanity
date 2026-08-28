---
"next-sanity": minor
---

feat(image): accept Sanity image objects and asset ids as `src`. `<Image src={post.mainImage} projectId={projectId} dataset={dataset} alt="…" />` builds the CDN URL with `@sanity/image-url`, applies the crop set in the Studio, positions the crop around the hotspot when the requested aspect ratio differs, and uses `asset->metadata.lqip` for `placeholder="blur"` when no `blurDataURL` is given. `projectId` and `dataset` are read from the asset URL when the query dereferences it (`asset->{url}`). The new `queryParams` prop merges additional Sanity Image CDN params (e.g. `{blur: 50}`) into the image URL.
