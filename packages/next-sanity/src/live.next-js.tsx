// This is the implementation of `import {defineLive} from 'next-sanity/live' that is used when `cacheComponents: true` is set in `next.config.ts`.
// Next.js will, when `cacheComponents: true`, automatically import `next-js` conditions instead of `react-server`, to allow targeting this mode.

export {isCorsOriginError} from '#live/isCorsOriginError'

export {
  type DefineSanityLiveOptions,
  type DefinedSanityFetchType,
  type DefinedSanityLiveProps,
  type SanityFetchOptions,
  defineLive,
} from './experimental/live'

export {resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
