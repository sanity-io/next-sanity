---
'next-sanity': patch
---

fix(image): forward `queryParams.fit` to the image URL builder. For image objects and asset ids, `fit` was appended after `@sanity/image-url` had already computed the crop and hotspot `rect`, so the requested fit mode never influenced that rect. `fit`, the crop mode (`crop`) and a focal point (`fp-x` and `fp-y`) are now passed to the builder before the URL is generated, and those params are not repeated on the final URL. URLs that do not set `fit` are unchanged.
