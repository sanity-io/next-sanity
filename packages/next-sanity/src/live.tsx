// This is the fallback export condition for `import 'next-sanity/live'`,
// it should have the same type definitions as the other conditions so that userland don't have to worry about setting the right
// `customCondition` in their `tsconfig.json` in order to get accurate typings.
// The implementation here though should all throw errors, as importing this file means userland made a mistake and somehow a client component is
// trying to pull in something it shouldn't.

import type {ResolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import type {DefinedFetchType, DefinedLiveProps} from '#live/types'

import type {
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
} from './live/defineLive'

export {isCorsOriginError} from '#live/isCorsOriginError'

/**
 * @public
 */
export function defineLive(_config: DefineSanityLiveOptions): {
  fetch: DefinedFetchType
  Live: React.ComponentType<DefinedLiveProps>
  /**
   * @deprecated use `fetch` instead, and define your own `sanityFetch` function with logic for when to toggle `stega` and `perspective`
   */
  sanityFetch: DefinedSanityFetchType
  /**
   * @deprecated use `Live` instead, and define your own `SanityLive` component with logic for when to toggle `perspective`
   */
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
} {
  throw new Error(`defineLive can't be imported by a client component`)
}

/**
 * Resolves the perspective from the cookie that is set by `import { defineEnableDraftMode } from "next-sanity/draft-mode"`
 * @public
 */
export const resolvePerspectiveFromCookies: ResolvePerspectiveFromCookies = () => {
  throw new Error(`resolvePerspectiveFromCookies can't be imported by a client component`)
}

export type {PerspectiveType as LivePerspective} from '#live/types'
