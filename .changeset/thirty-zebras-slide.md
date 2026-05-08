---
'next-sanity': major
---

Remove `refreshOnFocus` prop from `<SanityLive>`

This prop was enabled by default for published content in top-level windows, so if you relied on it you can add it back like this:

Create a new `RefreshOnFocus` component:

```tsx
// app/RefreshOnFocus.tsx
'use client'

import {useRouter} from 'next/navigation'
import {startTransition, useEffect} from 'react'

const focusThrottleInterval = 5_000

export function RefreshOnFocus() {
  const router = useRouter()

  useEffect(() => {
    // If inside an iframe then don't refresh on focus
    if (window.self !== window.top) return

    const controller = new AbortController()
    let nextFocusRevalidatedAt = 0
    const callback = () => {
      const now = Date.now()
      if (now > nextFocusRevalidatedAt && document.visibilityState !== 'hidden') {
        startTransition(() => router.refresh())
        nextFocusRevalidatedAt = now + focusThrottleInterval
      }
    }

    const {signal} = controller
    document.addEventListener('visibilitychange', callback, {passive: true, signal})
    window.addEventListener('focus', callback, {passive: true, signal})

    return () => controller.abort()
  }, [router])

  return null
}
```

Then update your layout to include it:

```diff
// app/layout.tsx
import {SanityLive} from '#sanity/live'
+import {RefreshOnFocus} from './RefreshOnFocus'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive />
+      <RefreshOnFocus />
    </>
  )
}
```

The motivation for removing this feature is that most users saw this as unexpected behavior, especially since when using browser debug tools window focus events trigger often and [paired with how v16 behaves differently with link prefetching and the `router.refresh()` call it's bedt to remove it.](https://github.com/vercel/next.js/issues/93210)
