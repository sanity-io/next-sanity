---
'next-sanity': minor
---

Add `resolvePerspectiveFromCookies` utility

When `cacheComponents: false`, `sanityFetch` automatically resolves the `perspective` in [draft mode](https://nextjs.org/docs/app/guides/draft-mode) by reading a cookie that `defineEnableDraftMode` sets and that Presentation Tool updates when the user switches perspectives in the Studio.

The new `resolvePerspectiveFromCookies` utility exposes that resolution directly, so you can:

- Instrument draft mode with a custom toolbar that lists the perspectives currently used to fetch data on the page.
- Resolve `perspective` in `cacheComponents: true` components and pass it into `'use cache'` boundaries that call `sanityFetch`.

Here's how `sanityFetch` resolves it internally — wrap it in a helper to do the same:

```tsx
import {cookies, draftMode} from 'next/headers'
import {resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'

export async function resolvePerspective(): Promise<LivePerspective> {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return await resolvePerspectiveFromCookies({cookies: await cookies()})
  }
  return 'published'
}
```
