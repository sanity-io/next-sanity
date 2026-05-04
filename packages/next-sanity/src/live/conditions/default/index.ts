// This is the fallback export condition for `import 'next-sanity/live'`,
// it should have the same type definitions as the other conditions so that userland don't have to worry about setting the right
// `customCondition` in their `tsconfig.json` in order to get accurate typings.
// The implementation here though should all throw errors, as importing this file means userland made a mistake and somehow a client component is
// trying to pull in something it shouldn't.

import type {ResolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  StrictDefinedFetchType,
  StrictDefinedLiveProps,
} from '#live/types'

export {isCorsOriginError} from '#live/isCorsOriginError'
export {parseTags} from '#live/parseTags'

/**
 * One
 * @public
 */
export function defineLive(config: DefineLiveOptions & {strict: true}): {
  sanityFetch: StrictDefinedFetchType
  SanityLive: React.ComponentType<StrictDefinedLiveProps>
}
/**
 * Two
 * @public
 */
export function defineLive(config: DefineLiveOptions & {strict?: false}): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
/**
 * Three
 * @public
 */
export function defineLive(_config: DefineLiveOptions): never {
  throw new Error(`defineLive can't be imported by a client component`)
}


export const resolvePerspectiveFromCookies: ResolvePerspectiveFromCookies = () => {
  throw new Error(`resolvePerspectiveFromCookies can't be imported by a client component`)
}

export type {LivePerspective} from '#live/types'
