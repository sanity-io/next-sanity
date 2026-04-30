'use server'

import type {ClientPerspective, SyncTag} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {revalidateTag, updateTag} from 'next/cache'
import {cookies, draftMode} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'

export async function revalidateSyncTags(tags: SyncTag[]): Promise<void> {
  const {isEnabled: isDraftMode} = await draftMode()

  if (!isDraftMode) {
    revalidateTag('sanity:fetch-sync-tags', 'max')
  }

  const logTags: string[] = []
  for (const _tag of tags) {
    const tag = `sanity:${_tag}`
    if (isDraftMode) {
      revalidateTag(tag, 'max')
    } else {
      updateTag(tag)
    }
    logTags.push(tag)
  }

  // oxlint-disable-next-line no-console
  console.log(
    `<SanityLive /> ${isDraftMode ? `revalidated tags: ${logTags.join(', ')} with cache profile "max" ` : `updated tags: ${logTags.join(', ')} and revalidated tag: "sanity:fetch-sync-tags" with cache profile "max"`}`,
  )
}

export async function setPerspectiveCookie(perspective: ClientPerspective): Promise<void> {
  if (!(await draftMode()).isEnabled) {
    // throw new Error('Draft mode is not enabled, setting perspective cookie is not allowed')
    return
  }
  const sanitizedPerspective = sanitizePerspective(perspective, 'drafts')
  if (perspective !== sanitizedPerspective) {
    throw new Error(`Invalid perspective`, {cause: perspective})
  }

  ;(await cookies()).set(
    perspectiveCookieName,
    Array.isArray(sanitizedPerspective) ? sanitizedPerspective.join(',') : sanitizedPerspective,
    {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
    },
  )
}
