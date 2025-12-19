// This is the fallback export condition for `import 'next-sanity/live'`,
// it should have the same type definitions as the other conditions so that userland don't have to worry about setting the right
// `customCondition` in their `tsconfig.json` in order to get accurate typings.
// The implementation here though should all throw errors, as importing this file means userland made a mistake and somehow a client component is
// trying to pull in something it shouldn't.

export {isCorsOriginError} from '#isCorsOriginError'

import type {
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
  DefinedSanityLiveStreamType,
} from './live/defineLive'

/**
 * @public
 */
export function defineLive(_config: DefineSanityLiveOptions): {
  sanityFetch: DefinedSanityFetchType
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
  SanityLiveStream: DefinedSanityLiveStreamType
} {
  throw new Error('defineLive can only be used in React Server Components')
}

/**
 * @public
 */
export type {
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
  DefinedSanityLiveStreamType,
}
