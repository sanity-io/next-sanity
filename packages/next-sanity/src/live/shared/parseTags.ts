import type {SyncTag} from '@sanity/client'

import {cacheTagPrefixes} from './constants'


interface ParsedPublishedTags {
  tags: `${typeof cacheTagPrefixes.published}${SyncTag}`[]
  prefix: typeof cacheTagPrefixes.published
  prefixType: 'published'
}
interface ParsedDraftTags {
  tags: `${typeof cacheTagPrefixes.drafts}${SyncTag}`[]
  prefix: typeof cacheTagPrefixes.drafts
  prefixType: 'drafts'
}
type ParsedTags = ParsedPublishedTags | ParsedDraftTags

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
export function parseTags(
  unsafeTags: unknown,
): ParsedTags {
  if (!Array.isArray(unsafeTags)) {
    throw new TypeError('tags must be an array', {cause: {unsafeTags}})
  }
  if(unsafeTags.length === 0) {
    throw new TypeError('tags must be an non-empty array', {cause: {unsafeTags}})
  }
  if(unsafeTags.some(tag => typeof tag !== 'string')) {
    throw new TypeError('tags must be an array of strings', {cause: {unsafeTags}})
  }
  if(unsafeTags.some(tag => tag.startsWith(cacheTagPrefixes.published))) {
    const prefixType = 'published'
    const tags: ParsedPublishedTags['tags'] = []
    for (const tag of (unsafeTags as string[])) {
      if(tag.startsWith(cacheTagPrefixes.drafts)) {
        throw new TypeError('cannot mix published and drafts tags', {cause: {tag, unsafeTags}})
      }
      if(!(tag.startsWith(cacheTagPrefixes.published))) {
        throw new TypeError('tag must start with a valid prefix', {cause: {tag}})
      }
      tags.push(tag as `${typeof cacheTagPrefixes.published}${SyncTag}`)
    }
    return {tags, prefix: cacheTagPrefixes.published, prefixType}

  } else if(unsafeTags.some(tag => tag.startsWith(cacheTagPrefixes.drafts))) {
    const prefixType = 'drafts'
    const tags: ParsedDraftTags['tags'] = []
    for (const tag of (unsafeTags as string[])) {
      if(tag.startsWith(cacheTagPrefixes.published)) {
        throw new TypeError('cannot mix published and drafts tags', {cause: {tag, unsafeTags}})
      }
      if(!(tag.startsWith(cacheTagPrefixes.drafts))) {
        throw new TypeError('tag must start with a valid prefix', {cause: {tag}})
      }
      tags.push(tag as `${typeof cacheTagPrefixes.drafts}${SyncTag}`)
    }
    return {tags, prefix: cacheTagPrefixes.drafts, prefixType}
  }

  throw new Error('Failed to parse tags, no valid prefix found', {cause: {unsafeTags}})
}

const {tags, prefix, prefixType} = parseTags(['foo', 'bar'])
if(prefixType === 'published') {
  console.log(tags)
} else if(prefixType === 'drafts') {
  console.log(tags)
} else {
  throw new Error('Failed to parse tags, no valid prefix found', {cause: {prefixType}})
}