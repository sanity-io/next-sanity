import type {SyncTag} from '@sanity/client'

import {cacheTagPrefix} from './constants'

interface ParsedTags {
  tags: `${typeof cacheTagPrefix}${SyncTag}`[]
  tagsWithoutPrefix: SyncTag[]
  prefix: typeof cacheTagPrefix
}

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
export function parseTags(unsafeTags: unknown): ParsedTags {
  if (!Array.isArray(unsafeTags)) {
    throw new TypeError('tags must be an array', {cause: {unsafeTags}})
  }
  if (unsafeTags.length === 0) {
    throw new TypeError('tags must be an non-empty array', {cause: {unsafeTags}})
  }
  if (unsafeTags.some((tag) => typeof tag !== 'string')) {
    throw new TypeError('tags must be an array of strings', {cause: {unsafeTags}})
  }
  const tags: ParsedTags['tags'] = []
  const tagsWithoutPrefix: ParsedTags['tagsWithoutPrefix'] = []
  // oxlint-disable-next-line no-unsafe-type-assertion
  for (const tag of unsafeTags as string[]) {
    if (!tag.startsWith(cacheTagPrefix)) {
      throw new TypeError('tag must start with a valid prefix', {cause: {tag}})
    }
    // oxlint-disable-next-line no-unsafe-type-assertion
    tags.push(tag as `${typeof cacheTagPrefix}${SyncTag}`)
    // oxlint-disable-next-line no-unsafe-type-assertion
    tagsWithoutPrefix.push(tag.slice(cacheTagPrefix.length) as SyncTag)
  }

  return {tags, tagsWithoutPrefix, prefix: cacheTagPrefix}
}
