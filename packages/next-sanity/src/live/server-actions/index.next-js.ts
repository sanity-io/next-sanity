'use server'

import type {SanityLiveActionContext} from '#live/types'
import type {LiveEvent} from '@sanity/client'

import {parseTags} from '#live/parseTags'
import {refresh, updateTag} from 'next/cache'
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
  if ((await draftMode()).isEnabled) {
    console.warn(
      `<SanityLive ${context.includeAllDocuments ? 'includeAllDocuments ' : ''}/> action called in draft mode, cache is bypassed in draft mode so the refresh() function is called instead of updateTag()`,
      {event, context},
    )
    refresh()
    return undefined
  }

  const tags = parseTags(event.tags, context)
  for (const tag of tags) {
    updateTag(tag)
  }
  // oxlint-disable-next-line no-console
  console.log(
    `<SanityLive ${context.includeAllDocuments ? 'includeAllDocuments ' : ''}/> updated tags: ${tags.join(', ')}`,
  )
}

/**
 * Used by `<SanityLive reconnectAction={actionRefresh} restartAction={actionRefresh} />`
 */
export async function actionRefresh(): Promise<void> {
  refresh()
}
