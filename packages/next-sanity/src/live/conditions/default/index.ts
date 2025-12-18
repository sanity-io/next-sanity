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
 * @public
 */
export function defineLive(config: DefineLiveOptions & {strict: true}): {
  sanityFetch: StrictDefinedFetchType
  SanityLive: React.ComponentType<StrictDefinedLiveProps>
}
export function defineLive(config: DefineLiveOptions & {strict?: false}): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
export function defineLive(_config: DefineLiveOptions): never {
  throw new Error(`defineLive can't be imported by a client component`)
}

/**
 * Reads the active draft-mode perspective from the cookie set by
 * {@link "next-sanity/draft-mode".defineEnableDraftMode | `defineEnableDraftMode`}, falling back to `'drafts'`
 * when the cookie is missing or contains an invalid value.
 *
 * This helper is intended for use with Next.js Cache Components (`cacheComponents: true`),
 * where `cookies()` and `draftMode()` cannot be called inside `'use cache'` boundaries.
 * Resolve the perspective once outside the cache boundary and pass it in as a prop / cache key.
 *
 * The caller is responsible for awaiting `cookies()` from `next/headers` and passing the
 * resulting cookie store as the `cookies` option — this keeps the helper free of dynamic APIs
 * so it can be invoked from anywhere a `ReadonlyRequestCookies` instance is available.
 *
 * @example
 * ```ts
 * import {cookies} from 'next/headers'
 * import {resolvePerspectiveFromCookies} from 'next-sanity/live'
 *
 * const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
 * ```
 *
 * @public
 */
export const resolvePerspectiveFromCookies: ResolvePerspectiveFromCookies = () => {
  throw new Error(`resolvePerspectiveFromCookies can't be imported by a client component`)
}

export type {PerspectiveType as LivePerspective} from '#live/types'
