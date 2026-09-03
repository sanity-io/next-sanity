---
"@sanity/next-sanity-functions": minor
---

feat: add `@sanity/next-sanity-functions`, the Sanity Function side of `defineInvalidateSyncTags`

`defineInvalidateSyncTagsHandler({secret, urls})` returns a sync tag invalidate handler that signs `{syncTags}` with `@sanity/webhook`, POSTs it to every URL in parallel, logs each outcome, and always calls `done()` so a failing origin never holds a live event back. `invalidateSyncTags(syncTags, options)` is the send step on its own for handlers you compose yourself. The package has no Next.js or React dependency.

```ts
// functions/invalidate-sync-tags/index.ts
import {defineInvalidateSyncTagsHandler} from "@sanity/next-sanity-functions"

export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URL,
})
```
