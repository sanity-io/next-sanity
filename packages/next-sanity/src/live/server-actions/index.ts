'use server'

import type {SyncTag} from '@sanity/client'
import {refresh, revalidateTag, updateTag} from 'next/cache'
import {draftMode} from 'next/headers'

import {parseTags} from '#live/parseTags'

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function revalidateSyncTags(tags: SyncTag[]): Promise<void | 'refresh'> {
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

  if (isDraftMode) {
    return 'refresh'
  }
}

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function revalidateSyncTagsAction(unsafeTags: unknown): Promise<void | 'refresh'> {
  if ((await draftMode()).isEnabled) {
    console.warn(
      `<SanityLive /> action called in draft mode, cache is bypassed in draft mode so the refresh() function is called instead of revalidating tags`,
    )
    return refresh()
  }

  const {tags} = parseTags(unsafeTags)

  if (process.env.NODE_ENV === 'development') {
    for (const tag of tags) {
      updateTag(tag)
    }
    // oxlint-disable-next-line no-console
    console.log(
      `<SanityLive /> action called in dev mode, updated tags: ${tags.join(', ')}. In production revalidateTag(tag, 'max') will be used instead of updateTag(tag)`,
    )
    return undefined
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }
  // oxlint-disable-next-line no-console
  console.log(`<SanityLive /> revalidated tags: ${tags.join(', ')} with cache profile "max" `)
}
