'use server'

import {refresh, updateTag} from 'next/cache'
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
  // oxlint-disable-next-line no-console
  console.log(
    `<SanityLive ${prefixType === 'drafts' ? 'includeDrafts ' : ''}/> updated tags: ${tags.join(', ')}`,
  )
}

/**
 * Used by `<SanityLive onReconnect={actionRefresh} onRestart={actionRefresh} />`
 */
export async function actionRefresh(): Promise<void> {
  refresh()
}
