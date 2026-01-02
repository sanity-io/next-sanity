import type {ClientPerspective} from '@sanity/client'

import {sanitizePerspective} from '#live/sanitizePerspective'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {cookies, draftMode} from 'next/headers'

/**
 * @internal
 */
export async function resolveCookiePerspective(): Promise<Exclude<ClientPerspective, 'raw'>> {
  return (await draftMode()).isEnabled
    ? (await cookies()).has(perspectiveCookieName)
      ? sanitizePerspective((await cookies()).get(perspectiveCookieName)?.value, 'drafts')
      : 'drafts'
    : 'published'
}
