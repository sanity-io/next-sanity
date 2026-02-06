import type {LiveEvent, SyncTag} from '@sanity/client'

import type {SanityLiveActionContext} from './types'

import {DRAFT_SYNC_TAG_PREFIX, PUBLISHED_SYNC_TAG_PREFIX} from './constants'

/**
 * Prefixes live event tags according to the conventions used by `defineLive().sanityFetch()`
 * so that they can be used with `import {updateTag} from 'next/cache'`.
 *
 * @example
 * ```tsx
 * import {updateTag} from 'next/cache'
 * import {parseTags} from 'next-sanity/live'
 * import {SanityLive} from '#sanity/live
 *
 * <SanityLive
 *   action={async (event, context) => {
 *     'use server'
 *
 *     for (const tag of parseTags(event.tags, context)) {
 *       updateTag(tag)
 *     }
 *   }}
 * />
 * ```
 */
export function parseTags<const Tags extends Extract<LiveEvent, {type: 'message'}>['tags']>(
  tags: Tags,
  context: SanityLiveActionContext,
): `${typeof PUBLISHED_SYNC_TAG_PREFIX | typeof DRAFT_SYNC_TAG_PREFIX}${SyncTag}`[] {
  if (!Array.isArray(tags)) {
    throw new TypeError('tags must be an array', {cause: {tags, context}})
  }
  return tags.map(
    (tag) =>
      `${context.includeAllDocuments ? PUBLISHED_SYNC_TAG_PREFIX : DRAFT_SYNC_TAG_PREFIX}${tag}` as const,
  )
}
