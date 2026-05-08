import type {CacheTagPrefix, CacheTagPrefixes} from '#live/types'

/**
 * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
 */
export const revalidate = 31_536_000 // 365 days

export const cacheTagPrefixes = {
  published: 'sanity:',
  drafts: 'sanity-drafts:',
} satisfies CacheTagPrefixes

// @TODO make this configurable
export const cacheTagPrefix = 'sanity:' satisfies CacheTagPrefix