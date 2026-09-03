---
"next-sanity": minor
---

feat(live): add `defineInvalidateSyncTags` at `next-sanity/live/invalidate`

A route handler factory for the sync tag invalidate Sanity Function that backs `<SanityLive waitFor="function">`. It verifies the `@sanity/webhook` signature on the request, rejects signatures older than five minutes, prefixes the sync tags the same way `sanityFetch` tags cache entries, and expires each tag with `revalidateTag(tag, {expire: 0})`. Pair it with `defineInvalidateSyncTagsHandler` from the new `@sanity/next-sanity-functions` package in the function.

Before, the route was hand-rolled:

```ts
// app/api/revalidate/route.ts
import {timingSafeEqual} from "node:crypto"
import {parseTags} from "next-sanity/live"
import {revalidateTag} from "next/cache"

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) return Response.json({message: "not configured"}, {status: 503})
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") ?? "")
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return Response.json({message: "unauthorized"}, {status: 401})
  }
  const {syncTags} = await request.json()
  const {tags} = parseTags(syncTags.map((tag: string) => `sanity:${tag}`))
  for (const tag of tags) revalidateTag(tag, {expire: 0})
  return Response.json({revalidated: true, tags})
}
```

After:

```ts
// app/api/revalidate/route.ts
import {defineInvalidateSyncTags} from "next-sanity/live/invalidate"

export const {POST} = defineInvalidateSyncTags({secret: process.env.SANITY_REVALIDATE_SECRET})
```
