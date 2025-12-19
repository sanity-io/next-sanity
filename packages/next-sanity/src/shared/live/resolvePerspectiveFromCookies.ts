import type {ClientPerspective} from '@sanity/client'
import type {cookies} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'

/**
 * Resolves the perspective from the cookie that is set by `import { defineEnableDraftMode } from "next-sanity/draft-mode"`
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
