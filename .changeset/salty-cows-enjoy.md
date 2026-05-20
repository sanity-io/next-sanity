---
'next-sanity': patch
---

Never set `resultSourceMap` for `fetch-sync-tags` requests in `sanityFetch`

Previously, if the `client` had `resultSourceMap` set to `'withKeyArraySelector'` or `true`, both `client.fetch()` calls inside `sanityFetch()` would request content source maps. The first call (a `fetch-sync-tags` request) never returns them, so it now omits the option.
