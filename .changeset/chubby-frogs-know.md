---
'next-sanity': major
---

Remove `intervalOnGoAway` prop, change signature of `onGoAway`

If you customized `intervalOnGoAway`, `onGoAway`, or your own `internalOnGoAway` behavior, move that logic into the new `onGoAway` callback and call the provided `setPollingInterval()` helper.

#### Before

`onGoAway` received `(event, intervalOnGoAway)`, and polling interval was configured separately:

```tsx
// app/client-functions.ts
'use client'
import type {LiveEventGoAway} from '@sanity/client'

export function onGoAway(event: LiveEventGoAway, intervalOnGoAway: number | false) {
  if (intervalOnGoAway) {
    console.warn(
      'Sanity Live connection closed, switching to long polling set to an interval of',
      intervalOnGoAway / 1000,
      'seconds and the server gave this reason:',
      event.reason,
    )
  } else {
    console.error(
      'Sanity Live connection closed, automatic revalidation is disabled, the server gave this reason:',
      event.reason,
    )
  }
}
```

```tsx
// app/layout.tsx
import {onGoAway} from './client-functions'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive intervalOnGoAway={15_000} onGoAway={onGoAway} />
    </>
  )
}
```

#### After

`onGoAway` now receives `(event, context, setPollingInterval)`.
Use `setPollingInterval(ms)` from inside `onGoAway` when you want long-polling fallback:

```tsx
// app/client-functions.ts
'use client'

import type {SanityLiveOnGoaway} from 'next-sanity/live'

export const onGoAway: SanityLiveOnGoaway = (event, {includeDrafts}, setPollingInterval) => {
  const interval = 15_000
  console.warn(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> connection is closed after receiving a 'goaway' event, the server gave this reason:`,
    JSON.stringify(event.reason),
    `Content will now be refreshed every ${interval / 1_000} seconds`,
  )
  setPollingInterval(interval)
}
```

```tsx
// app/layout.tsx
import {onGoAway} from './client-functions'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive onGoAway={onGoAway} />
    </>
  )
}
```

To disable fallback polling entirely, pass `onGoAway={false}`.
