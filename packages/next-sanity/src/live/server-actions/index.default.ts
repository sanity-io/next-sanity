'use server'

import type {SanityLiveActionContext} from '#live/types'
import type {LiveEvent} from '@sanity/client'

import {parseTags} from '#live/parseTags'
import {refresh, revalidateTag, updateTag} from 'next/cache'
import {draftMode} from 'next/headers'

/**
 * Used by `<SanityLive action={actionRevalidateTags} />`
 */
export async function actionUpdateTags(
  event: Extract<LiveEvent, {type: 'message'}>,
  context: SanityLiveActionContext,
): Promise<void> {
  if (!Array.isArray(event.tags)) {
    console.warn(
      `<SanityLive ${context.includeAllDocuments ? 'includeAllDocuments ' : ''}/> action called with non-array tags`,
      event,
    )
    return undefined
  }

  if (context.includeAllDocuments) {
    if (!(await draftMode()).isEnabled) {
      console.warn('<SanityLive includeAllDocuments /> action called in non-draft mode, ignoring', {
        event,
        context,
      })
      return undefined
    }
    const tags = parseTags(event.tags, context)
    for (const tag of tags) {
      updateTag(tag)
    }
    // oxlint-disable-next-line no-console
    console.log(`<SanityLive includeAllDocuments /> updated tags: ${tags.join(', ')}`)
  } else {
    revalidateTag('sanity:fetch-sync-tags', 'max')
    // oxlint-disable-next-line no-console
    console.log(`<SanityLive /> revalidated tag: "sanity:fetch-sync-tags" with cache profile "max"`)
    const tags = parseTags(event.tags, context)
    for (const tag of tags) {
      updateTag(tag)
    }
    // oxlint-disable-next-line no-console
    console.log(`<SanityLive /> updated tags: ${tags.join(', ')}`)
  }
}

/**
 * Used by `<SanityLive reconnectAction={actionRefresh} restartAction={actionRefresh} />`
 */
export async function actionRefresh(): Promise<void> {
  refresh()
}
