'use server'

import {refresh, revalidateTag} from 'next/cache'
import {draftMode} from 'next/headers'

import {parseTags} from '#live/parseTags'

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function revalidateSyncTagsAction(unsafeTags: unknown): Promise<void> {
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
    revalidateTag(tag, 'max')
  }

  // oxlint-disable-next-line no-console
  console.log(
    `<SanityLive ${prefixType === 'drafts' ? 'includeDrafts ' : ''}/> revalidated tags: ${tags.join(', ')} with cache profile "max" `,
  )
}

/**
 * Used by `<SanityLive onReconnect={refreshAction} onRestart={refreshAction} />`
 * @deprecated - refactor `onReconnect` and `onRestart` to support `() => 'refresh'`
 */
export async function refreshAction(): Promise<void> {
  refresh()
}
