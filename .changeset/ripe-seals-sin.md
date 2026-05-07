---
'next-sanity': minor
---

Add `resolvePerspectiveFromCookies` utility

When `cacheComponents: false` the `sanityFetch` function returned by `defineLive` will automatically resolve the `perspective` when in [draft mode](https://nextjs.org/docs/app/guides/draft-mode).
The way it resolves it is by reading a cookie that is set by the `defineEnableDraftMode` function, and updated by `Presentation Tool` when the user switches perspectives in the Studio.

The `resolvePerspectiveFromCookies` utility allows you to resolve the `perspective` in the same way so you can:

- Instrument draft mode with a custom toolbar that lists out what perspectives is currently used to fetch data on the page.
- Resolve `perspective` the same way in `cacheComponents: true` components, providing it as input to `'use cache'` boundaries that call `sanityFetch`.

Here's how to call it the same way that `sanityFetch` does:

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
