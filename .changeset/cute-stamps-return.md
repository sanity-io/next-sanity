---
'next-sanity': major
---

Add `onError="throw"` opt-in for `<SanityLive>` to throw errors during render

The previous default behavior logged errors to the console (CORS errors as `console.warn`, other errors as `console.error`). An unreleased change made the default throw during render, which was disruptive. This reverts the default to the v12 logging behavior and adds `onError="throw"` as an explicit opt-in for throw-during-render.

#### Opt-in to throw during render

If you want errors to throw during render (e.g. to be caught by a React error boundary), you can opt-in with `onError="throw"`:

```tsx
// app/layout.tsx
import SanityLiveErrorBoundary from './SanityLiveErrorBoundary'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLiveErrorBoundary>
        <SanityLive onError="throw" />
      </SanityLiveErrorBoundary>
    </>
  )
}
```

This is similar to how `action="refresh"` and `onRestart="refresh"` work as shorthand string values.

#### Custom error handler

You can still pass a custom error handler function:

```ts
// app/client-functions.ts
'use client'

import {isCorsOriginError, type SanityLiveOnError} from 'next-sanity/live'

export const onError: SanityLiveOnError = (error, {includeDrafts, waitFor}) => {
  if (isCorsOriginError(error)) {
    console.warn(
      `Sanity Live is unable to connect to the Sanity API as the current origin - ${window.origin} - is not in the list of allowed CORS origins for this Sanity Project.`,
      error.addOriginUrl && `Add it here:`,
      error.addOriginUrl?.toString(),
    )
  } else {
    console.error('Sanity Live encountered an error:', error, {includeDrafts, waitFor})
  }
}
```

Then in your `layout.tsx` file, import the `onError` function and pass it to `<SanityLive>`:

```tsx
// app/layout.tsx
import {onError} from './client-functions'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive onError={onError} />
    </>
  )
}
```
