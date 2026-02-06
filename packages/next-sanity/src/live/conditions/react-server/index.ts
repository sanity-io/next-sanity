// This is the implementation of `import {defineLive} from 'next-sanity/live' that is used when `cacheComponents: false` is set in `next.config.ts`.
// Or more accurately, that `next.config.ts` does not have `cacheComponents: true` set as it is opt-in.
// While this implementation works, it's not super ideal, and we should warn in NOdE_ENV !== 'production' that we recommend using `cacheComponents: true` instead.
// Among other reasons we have to double-fetch to set cache tags, while the customer doesn't pay for the additional fetch it still adds latency to the server render.

export {defineLive} from './defineLive'
export {isCorsOriginError} from '#live/isCorsOriginError'
export {parseTags} from '#live/parseTags'
export {resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'

export type {PerspectiveType as LivePerspective} from '#live/types'
