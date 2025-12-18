'use server'

import {DRAFT_SYNC_TAG_PREFIX, PUBLISHED_SYNC_TAG_PREFIX} from '#live/constants'
import {revalidateTag, updateTag} from 'next/cache'

/**
 * Used by `<SanityLive onLiveEvent={actionLiveEvent} />`
 */
export async function actionLiveEvent(_tags: unknown): Promise<void> {
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

  revalidateTag('sanity:fetch-sync-tags', 'max')

  for (const tag of tags) {
    revalidateTag(tag, {expire: 0})
    // oxlint-disable-next-line no-console
    console.log(`<SanityLive /> revalidated tag: ${tag}`)
  }
}

/**
 * Used by `<SanityLive onLiveEventIncludingDrafts={actionLiveEventIncludingDrafts} />`
 */
export async function actionLiveEventIncludingDrafts(_tags: unknown): Promise<void> {
  // @TODO check draft mode before expiring tags
  if (!Array.isArray(_tags)) {
    console.warn('<SanityLive /> `expireTags` called with non-array tags', _tags)
    return undefined
  }
  const tags = _tags.filter(
    (tag) => typeof tag === 'string' && tag.startsWith(DRAFT_SYNC_TAG_PREFIX),
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
