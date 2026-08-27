---
'next-sanity': patch
---

fix(image): strip stega-encoded metadata from `src` in `Image` and `imageLoader`, so custom `stega.filter` setups that encode URLs can't corrupt CDN requests.
