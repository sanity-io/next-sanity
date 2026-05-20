---
'next-sanity': minor
---

Add `onError="throw"` opt-in for `<SanityLive>`

The default still logs errors with `console.error` (CORS errors use `console.warn` and include the blocked origin), matching `next-sanity@12`.

Pass `onError="throw"` to throw errors during render so they can be caught by the [unstable_catchError API](https://nextjs.org/docs/app/api-reference/functions/catchError), which supports `unstable_retry` for retrying the render.

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
import {SanityLive} from '@/sanity/lib/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive onError={onError} />
    </>
  )
}
```

#### Customize the error boundary

Using the [unstable_catchError API](https://nextjs.org/docs/app/api-reference/functions/catchError), you can create an error boundary that handles errors and offers retry logic. Here's an example that uses the `sonner` library to show error toasts that adapt to the error type:

```tsx
// app/SanityLiveErrorBoundary.tsx
'use client'

import {isCorsOriginError} from 'next-sanity/live'
import {unstable_catchError, type ErrorInfo} from 'next/error'
import {useEffect} from 'react'
import {toast} from 'sonner'

function SanityLiveErrorBoundary(_props: {}, {error, unstable_retry}: ErrorInfo) {
  useEffect(() => {
    let toastId: string | number | undefined
    if (isCorsOriginError(error)) {
      const {addOriginUrl} = error
      toastId = toast.warning(`Sanity Live couldn't connect`, {
        description: `${new URL(window.origin).host} is blocked by CORS policy`,
        richColors: true,
        duration: Infinity,
        action: addOriginUrl
          ? {
              label: 'Manage',
              onClick: (event) => {
                event.preventDefault()
                window.open(addOriginUrl.toString(), '_blank')
              },
            }
          : {label: 'Retry', onClick: () => unstable_retry()},
        cancel: addOriginUrl ? {label: 'Retry', onClick: () => unstable_retry()} : undefined,
      })
    } else if (error instanceof Error) {
      console.error(error)
      toastId = toast.error(error.message, {
        richColors: true,
        duration: Infinity,
        action: {label: 'Retry', onClick: () => unstable_retry()},
      })
    } else {
      console.error(error)
      toastId = toast.error('Unknown error', {
        description: 'Check the console for more details',
        richColors: true,
        duration: Infinity,
        action: {label: 'Retry', onClick: () => unstable_retry()},
      })
    }

    return () => {
      toast.dismiss(toastId)
    }
  }, [error, unstable_retry])

  return null
}

export default unstable_catchError(SanityLiveErrorBoundary)
```

Then in your `layout.tsx` file, wrap the `SanityLive` component in the error boundary:

```tsx
// app/layout.tsx
import SanityLiveErrorBoundary from './SanityLiveErrorBoundary'
import {SanityLive} from '@/sanity/lib/live'

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
