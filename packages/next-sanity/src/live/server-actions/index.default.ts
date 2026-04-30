'use server'

import {refresh, revalidateTag, updateTag} from 'next/cache'
import {draftMode} from 'next/headers'

import {parseTags} from '#live/parseTags'

/**
 * Used by `<SanityLive action={actionRevalidateTags} />`
 */
export async function actionUpdateTags(unsafeTags: unknown): Promise<void> {
  const {tags, prefixType} = parseTags(unsafeTags)
  if ((await draftMode()).isEnabled) {
    console.warn(
      `<SanityLive ${prefixType === 'drafts' ? 'includeDrafts ' : ''}/> action called in draft mode, cache is bypassed in draft mode so the refresh() function is called instead of updateTag()`,
      {tags},
    )
    refresh()
    return undefined
  }
  for (const tag of tags) {
    updateTag(tag)
  }
  revalidateTag('sanity:fetch-sync-tags', 'max')
  // oxlint-disable-next-line no-console
  console.log(
    `<SanityLive ${prefixType === 'drafts' ? 'includeDrafts ' : ''}/> updated tags: ${tags.join(', ')} and revalidated tag: "sanity:fetch-sync-tags" with cache profile "max"`,
  )
}

/**
 * Used by `<SanityLive onReconnect={actionRefresh} onRestart={actionRefresh} />`
 */
export async function actionRefresh(): Promise<void> {
  refresh()
}
