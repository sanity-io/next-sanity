import {
  type CorsOriginError,
  type DefineSanityLiveOptions,
  type DefinedSanityFetchType,
  type DefinedSanityLiveProps,
  type DefinedSanityLiveStreamType,
  isCorsOriginError,
  defineLive as defineLiveImplementation,
} from '@sanity/next-loader'

export {
  type CorsOriginError,
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
  DefinedSanityLiveStreamType,
  isCorsOriginError,
}

let warned = false
/**
 * @deprecated import `defineLive` from `next-sanity/live` instead
 */
export function defineLive(options: DefineSanityLiveOptions) {
  if (!warned) {
    console.warn(
      `Importing defineLive from the root import is deprecated and will be removed in next-sanity v11. Please change "import {defineLive} from 'next-sanity'" to "import {definveLive} from 'next-sanity/live'"`,
    )
    warned = true
  }
  return defineLiveImplementation(options)
}
