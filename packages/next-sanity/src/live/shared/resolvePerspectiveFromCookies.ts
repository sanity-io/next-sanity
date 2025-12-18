import type {ClientPerspective} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import type {cookies} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'

/**
 * @deprecated - refactor to exporting the same function instead
 */
export type ResolvePerspectiveFromCookies = (options: {
  /**
   * You must await the cookies() function from next/headers
   * and pass it here.
   * Example:
   * ```ts
   * import { cookies } from 'next/headers'
   *
   * const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
   * ```
   */
  cookies: Awaited<ReturnType<typeof cookies>>
}) => Promise<Exclude<ClientPerspective, 'raw'>>

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
export async function resolvePerspectiveFromCookies({
  cookies: jar,
}: {
  cookies: Awaited<ReturnType<typeof cookies>>
}): Promise<Exclude<ClientPerspective, 'raw'>> {
  return jar.has(perspectiveCookieName)
    ? sanitizePerspective(jar.get(perspectiveCookieName)?.value, 'drafts')
    : 'drafts'
}
