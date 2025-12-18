'use server'

import type {ClientPerspective, SyncTag} from '@sanity/client'

import {PUBLISHED_SYNC_TAG_PREFIX} from '#live/constants'
import {sanitizePerspective} from '#live/sanitizePerspective'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {revalidateTag, updateTag} from 'next/cache'
import {cookies, draftMode} from 'next/headers'

export async function revalidateSyncTags(tags: SyncTag[]): Promise<void> {
  revalidateTag('sanity:fetch-sync-tags', 'max')

  for (const _tag of tags) {
    const tag = `sanity:${_tag}`
    revalidateTag(tag, {expire: 0})
    // oxlint-disable-next-line no-console
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

// @TODO expose parseTags function that returns the correct array of tags
// we already have s1: prefixes, but they could change
// use sp: for prod, sd: for draft, keep em short
export async function expireTags(_tags: unknown): Promise<void> {
  // @TODO Draft Mode bypasses cache anyway so we don't bother with expiring tags for draft content
  // const isDraftMode = (await draftMode()).isEnabled
  // const tags = _tags.map((tag) => `${isDraftMode ? 'drafts' : 'sanity'}:${tag}`)
  if (!Array.isArray(_tags)) {
    console.warn('<SanityLive /> `expireTags` called with non-array tags', _tags)
    return undefined
  }
  const tags = _tags.filter(
    (tag) => typeof tag === 'string' && tag.startsWith(PUBLISHED_SYNC_TAG_PREFIX),
  )
  if (!tags.length) {
    console.warn('<SanityLive /> `expireTags` called with no valid tags', _tags)
    return undefined
  }
  for (const tag of tags) {
    updateTag(tag)
  }
  // oxlint-disable-next-line no-console
  console.log(`<SanityLive /> updated tags: ${tags.join(', ')}`)
}
