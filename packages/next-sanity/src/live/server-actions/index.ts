'use server'

import type {ClientPerspective, SyncTag} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {revalidateTag} from 'next/cache'
import {cookies, draftMode} from 'next/headers'
import {sanitizePerspective} from '../utils'

export async function revalidateSyncTags(tags: SyncTag[]): Promise<void> {
  revalidateTag('sanity:fetch-sync-tags', 'max')

  for (const _tag of tags) {
    const tag = `sanity:${_tag}`
    revalidateTag(tag, {expire: 0})
    console.log(`<SanityLive /> revalidated tag: ${tag}`)
  }
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
