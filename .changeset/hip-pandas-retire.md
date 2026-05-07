---
'next-sanity': major
---

Removed the deprecated `useIsLivePreview` hook

The `useIsLivePreview` hook would return `true` in two cases:

- a) If the app is detected as rendered within an iframe, or a new window, where the parent window is a Sanity Studio running Presentation Tool.
- b) `<SanityLive />` is rendered on the page with `browserToken` in `defineLive` given a value, and draft mode is enabled.

For use case a) you can use the `useIsPresentationTool` hook instead. For use case b) things started getting a bit tricky when desiring to add support for multiple instances of `<SanityLive />` on the same page that connect to different datasets or even different projects, as well as giving userland control over when `<SanityLive />` sets the `includeDrafts` option, instead of relying on the v12 behavior of always setting it to `true` when `draftMode().isEnabled`, with no way to opt-out when in draft mode, nor to opt-in when not in draft mode.

#### Before

`useIsLivePreview()` could resolve as long as `<SanityLive />` was rendered (with `browserToken` configured in `defineLive`) while draft mode was enabled:

```tsx
// app/layout.tsx
import {SanityLive} from 'next-sanity/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

import {DebugStatus} from './DebugStatus'

export default async function Layout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      {isDraftMode && <DebugStatus />}
      {children}
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  )
}
```

```tsx
// app/DebugStatus.tsx
'use client'
import {useIsLivePreview} from 'next-sanity/hooks'

export function DebugStatus() {
  const isLivePreview = useIsLivePreview()
  return <p>Is Live Preview: {String(isLivePreview)}</p>
}
```

#### After

Create a userland provider (for example `IsLivePreviewProvider`) and wrap the components that call `useIsLivePreview()`:

```tsx
// app/IsLivePreviewContext.tsx
'use client'

import {useVisualEditingEnvironment} from 'next-sanity/hooks'
import {createContext, use} from 'react'

const IsLivePreviewContext = createContext<boolean | null>(false)

export function IsLivePreviewProvider({children}: {children: React.ReactNode}) {
  // The useVisualEditingEnvironment() hook requires `<VisualEditing />` to render in the root layout for it to resolve the env correctly.
  const environment = useVisualEditingEnvironment()

  return (
    <IsLivePreviewContext value={environment === null ? null : true}>
      {children}
    </IsLivePreviewContext>
  )
}

export function useIsLivePreview() {
  return use(IsLivePreviewContext)
}
```

```tsx
// app/layout.tsx
import {SanityLive} from 'next-sanity/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

import {DebugStatus} from './DebugStatus'
import {IsLivePreviewProvider} from './IsLivePreviewContext'

export default async function Layout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      {isDraftMode && (
        <IsLivePreviewProvider>
          <DebugStatus />
        </IsLivePreviewProvider>
      )}
      {children}
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  )
}
```

```tsx
// app/DebugStatus.tsx
'use client'
import {useIsLivePreview} from './IsLivePreviewContext'

export function DebugStatus() {
  const isLivePreview = useIsLivePreview()
  return <p>Is Live Preview: {String(isLivePreview)}</p>
}
```
