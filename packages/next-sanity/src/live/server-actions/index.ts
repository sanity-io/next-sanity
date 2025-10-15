'use server'

import type {ClientPerspective, SyncTag} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {revalidateTag} from 'next/cache'
import {cookies, draftMode} from 'next/headers'
import {sanitizePerspective} from '../utils'

export async function revalidateSyncTags(tags: SyncTag[]): Promise<void> {
  // @ts-expect-error - intentionally not passing the second argument as we need to support Next.js 15, which does not have `updateTag`: https://nextjs.org/docs/beta/app/getting-started/caching-and-revalidating#revalidatetag
  await revalidateTag('sanity:fetch-sync-tags')

  for (const _tag of tags) {
    const tag = `sanity:${_tag}`
    // @ts-expect-error - intentionally not passing the second argument as we need to support Next.js 15, which does not have `updateTag`: https://nextjs.org/docs/beta/app/getting-started/caching-and-revalidating#revalidatetag
    revalidateTag(tag)
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
    throw new Error(`Invalid perspective: ${perspective}`)
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
