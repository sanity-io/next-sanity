---
'next-sanity': major
---

Remove `refreshOnMount` prop from `<SanityLive>`

This prop was `false` by default, so if you weren't using it you won't be affected by this change.

If you were using it, here's how you can add back the same functionality:

Create a new `RefreshOnMount` component:

```tsx
// app/RefreshOnMount.tsx
import {useRouter} from 'next/navigation'
import {useEffect, useReducer, startTransition} from 'react'

/**
 * Handles refreshing the page when the page is mounted,
 * in case the content changes at a high enough frequency that by
 * the time the page started streaming, and the <SanityLive> component sets
 * up the EventSource connection, content might have changed.
 */
export function RefreshOnMount() {
  const router = useRouter()
  const [mounted, mount] = useReducer(() => true, false)

  useEffect(() => {
    if (!mounted) {
      startTransition(() => {
        mount()
        router.refresh()
      })
    }
  }, [mounted, router])

  return null
}
```

Then update your layout to include it:

```diff
// app/layout.tsx
import {SanityLive} from '#sanity/live'
+import {DebugStatus} from './RefreshOnMount'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
-      <SanityLive refreshOnMount />
+      <SanityLive />
+      <RefreshOnMount />
    </>
  )
}
```
