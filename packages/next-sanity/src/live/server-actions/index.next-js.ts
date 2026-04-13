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
 *
 * Returns `'refresh'` to signal the client component to call `router.refresh()`
 * instead of triggering a server-side `refresh()`. This avoids a full page reload
 * on dynamic catch-all routes where server-side `refresh()` causes a hard navigation.
 */
export async function actionRefresh(): Promise<'refresh'> {
  return 'refresh'
}
