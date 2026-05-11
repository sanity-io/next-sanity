---
'next-sanity': minor
---

Add `onWelcome` prop to `<SanityLive>`

The default behavior is to log a welcome message to the console, here's how to customize it:

```tsx
// app/client-functions.ts
'use client'

import type {SanityLiveOnWelcome} from 'next-sanity/live'

export const onWelcome: SanityLiveOnWelcome = (event, {includeDrafts, waitFor}) => {
  console.info(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> is connected and listening for live events to ${includeDrafts ? 'all content including drafts and version documents in content releases' : 'published content'}.${waitFor === 'function' ? ' Events will be delayed until after a Sanity Function has processed them.' : ''}`,
  )
}
```

```tsx
// app/layout.tsx
import {onWelcome} from './client-functions'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive onWelcome={onWelcome} />
    </>
  )
}
```

To disable default welcome message, pass `onWelcome={false}`.
