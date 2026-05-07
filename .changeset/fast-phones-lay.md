---
'next-sanity': major
---

Remove the deprecated `useDraftModePerspective` hook

When used on an app that has `<SanityLive />` and `<VisualEditing />`, it would resolve to the `perspective` that is used by the `sanityFetch` calls on the page.
The `resolvePerspectiveFromCookies` server component helper can be used instead. Here's how you can create your own `useDraftModePerspective` hook that works the same way as the deprecated one:

#### Before

```tsx
// app/layout.tsx
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '#sanity/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

```tsx
// app/DebugStatus.tsx
'use client'
import {useDraftModePerspective} from 'next-sanity/hooks'

export function DebugStatus() {
  const perspective = useDraftModePerspective()
  return <p>Perspective: {JSON.stringify(perspective)}</p>
}
```

```tsx
// app/page.tsx
import {DebugStatus} from './DebugStatus'

export default function Page() {
  return (
    <>
      <DebugStatus />
    </>
  )
}
```

In this example the `DebugStatus` component will log `Perspective: "unknown"` in production, and when in draft mode it'll log `Perspective: "drafts"` or if a content release is previewed in Presentation Tool it could log `Perspective: ["rHFvpQcCq","r5RGhbQN9","drafts"]`.

#### After

```tsx
// app/layout.tsx
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '#sanity/live'
import {DraftModePerspective} from './DraftModePerspectiveProvider'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        <DraftModePerspective>{children}</DraftModePerspective>
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

```tsx
// app/DraftModePerspectiveProvider.tsx
import {resolvePerspectiveFromCookies} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import {Suspense} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'

async function DraftModePerspectiveProvider({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) return children
  const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
  return <DraftModePerspectiveContext value={perspective}>{children}</DraftModePerspectiveContext>
}

export function DraftModePerspective({children}: {children: React.ReactNode}) {
  return (
    <Suspense
      fallback={
        <DraftModePerspectiveContext value="checking">{children}</DraftModePerspectiveContext>
      }
    >
      <DraftModePerspectiveProvider>{children}</DraftModePerspectiveProvider>
    </Suspense>
  )
}
```

```tsx
// app/DraftModePerspectiveContext.tsx
'use client'

import type {LivePerspective} from 'next-sanity/live'
import {createContext} from 'react'

export const DraftModePerspectiveContext = createContext<'checking' | 'unknown' | LivePerspective>(
  'unknown',
)
```

```tsx
// app/DebugStatus.tsx
'use client'
import {use} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'

export function DebugStatus() {
  const perspective = use(DraftModePerspectiveContext)
  return <p>Perspective: {JSON.stringify(perspective)}</p>
}
```

```tsx
// app/page.tsx
import {DebugStatus} from './DebugStatus'

export default function Page() {
  return (
    <>
      <DebugStatus />
    </>
  )
}
```
