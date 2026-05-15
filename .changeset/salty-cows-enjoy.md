---
'next-sanity': patch
---

Never set `resultSourceMap` for `fetch-sync-tags` requests in `sanityFetch`

Previously if `client.config()` is set to `'withKeyArraySelector'` or `true` it would return content source maps for both underlying `client.fetch()` requests that `sanityFetch()` makes.
However, it's only needed for the second request, as the first request never returns content source maps.
