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
