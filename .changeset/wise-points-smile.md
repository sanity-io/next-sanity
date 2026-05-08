---
'next-sanity': major
---

Remove `refreshOnReconnect` prop from `<SanityLive>`

It was removed as Next.js itself is working [first class support for handling network connectivity changes](https://github.com/vercel/next.js/pull/92011), it can already be tested using `experimental.useOffline`, and so it no longer makes sense for us to implement it ourselves.

This prop was `true` by default, and only used when not in draft mode, so if you relied on this behavior you can add it back like this:

Create a new `RefreshOnReconnect` component:

```tsx
// app/RefreshOnReconnect.tsx
'use client'

import {useRouter} from 'next/navigation'
import {startTransition, useEffect} from 'react'

export function RefreshOnReconnect() {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    const {signal} = controller

    window.addEventListener('online', () => startTransition(() => router.refresh()), {
      passive: true,
      signal,
    })

    return () => controller.abort()
  }, [router])

  return null
}
```

Then update your layout to include it:

```diff
// app/layout.tsx
import {SanityLive} from '#sanity/live'
+import {RefreshOnReconnect} from './RefreshOnReconnect'

export default async function Layout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      {children}
      <SanityLive includeDrafts={isDraftMode} />
+      {!isDraftMode && <RefreshOnReconnect />}
    </>
  )
}
```
