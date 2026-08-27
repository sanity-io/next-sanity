---
'next-sanity': minor
---

feat(image): infer `width` and `height` from the Sanity CDN URL. `<Image src={url} alt="" />` now renders without explicit dimensions: they resolve from the URL's `w`/`h` params (e.g. set by an `@sanity/image-url` builder), its `rect` crop param, or the original dimensions Sanity encodes into every asset filename. Providing only one dimension derives the other from the image's aspect ratio, like `next/image` does for static imports.
