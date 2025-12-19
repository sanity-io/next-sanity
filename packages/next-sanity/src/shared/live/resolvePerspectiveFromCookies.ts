import type {ClientPerspective} from '@sanity/client'
import type {cookies} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'

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
 * Resolves the perspective from the cookie that is set by `import { defineEnableDraftMode } from "next-sanity/draft-mode"`
 * @public
 */
export const resolvePerspectiveFromCookies = async function resolvePerspectiveFromCookies({
  cookies: jar,
}: {
  cookies: Awaited<ReturnType<typeof cookies>>
}): Promise<Exclude<ClientPerspective, 'raw'>> {
  return jar.has(perspectiveCookieName)
    ? sanitizePerspective(jar.get(perspectiveCookieName)?.value, 'drafts')
    : 'drafts'
}
