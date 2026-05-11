---
'next-sanity': major
---

Throw errors during render if `onError` is not defined on `<SanityLive>`

If you were already handling errors in your own `onError` callback, then this is not a breaking change for you.

The new behavior is to avoid silent failures and instead throw errors during render so they can be caught by the nearest React error boundary.

#### Restore previous behavior

The previous behavior would `console.warn` or `console.error` the error, and continue rendering the component. If you prefer this behavior you can restore it this way:

Create a `client-functions.ts` file with `'use client'` and export a `onError` function like so:

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

#### Customize the error boundary

Using the [unstable_catchError API](https://nextjs.org/docs/app/api-reference/functions/catchError) you can create an error boundary that can handle errors and offer retry logic. Here's an example that uses the `sonner` library to show error toasts that adapt to the error type:

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

Then in your `layout.tsx` file wrap the `SanityLive` component in the error boundary:

```tsx
// app/layout.tsx
import SanityLiveErrorBoundary from './SanityLiveErrorBoundary'
import {SanityLive} from '#sanity/live'

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLiveErrorBoundary>
        <SanityLive />
      </SanityLiveErrorBoundary>
    </>
  )
}
```
