'use server'

import type {SyncTag} from '@sanity/client'
import {revalidateTag, updateTag} from 'next/cache'
import {draftMode} from 'next/headers'

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
