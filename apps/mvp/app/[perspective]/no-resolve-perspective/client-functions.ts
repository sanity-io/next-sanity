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
