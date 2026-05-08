'use server'

import {refresh, revalidateTag} from 'next/cache'
import {draftMode} from 'next/headers'

import {parseTags} from '#live/parseTags'

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function revalidateSyncTagsAction(unsafeTags: unknown): Promise<void> {
  const {tags} = parseTags(unsafeTags)
  if ((await draftMode()).isEnabled) {
    console.warn(
      `<SanityLive /> action called in draft mode, cache is bypassed in draft mode so the refresh() function is called instead of updateTag()`,
      {tags},
    )
    // @TODO this is a good fallback, but ideally the `revalidateSyncTags` action should not be passed to `<SanityLive>` when in draft mode, maybe the console log above should direct towards a pattern that saves us the server action POST and allow us to do a GET with router.refresh() instead
    refresh()
    return undefined
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }

  // oxlint-disable-next-line no-console
  console.log(`<SanityLive /> revalidated tags: ${tags.join(', ')} with cache profile "max" `)
}

/**
 * @deprecated - TODO add first class support for passing the string 'refresh'
 */
export async function temporaryRefreshAction(): Promise<'refresh'> {
  return 'refresh'
}


/**
 * Used by `<SanityLive onReconnect={refreshAction} onRestart={refreshAction} />`
 * @deprecated - refactor `onReconnect` and `onRestart` to support `() => 'refresh'`
 */
export async function refreshAction(): Promise<void> {
  refresh()
}
