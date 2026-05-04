import type {ClientPerspective} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import type {cookies} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'

/**
 * This helper is intended for use with Next.js Cache Components (`cacheComponents: true`),
 * where `cookies()` and `draftMode()` cannot be called inside `'use cache'` boundaries.
 * Resolve the perspective once outside the cache boundary and pass it in as a prop / cache key.
 *
 * @example
 * ```tsx
 * import {cookies, draftMode} from 'next/headers'
 * import {resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
 * import {sanityFetch} from '#sanity/live'
 *
 * function Page() {
 *   const {isEnabled: isDraftMode} = await draftMode()
 *   let perspective: LivePerspective = 'published'
 *   if(isDraftMode) {
 *     perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
 *   }
 *   const {data} = await cachedFetch({query, perspective, stega: isDraftMode})
 * }
 * function cachedFetch({query, params, perspective, stega}: {query: string, perspective: LivePerspective, stega: boolean}) {}) {
 *   'use cache'
 *   const {data} = await sanityFetch({query, params, perspective, stega})
 *   return {data}
 * }
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
