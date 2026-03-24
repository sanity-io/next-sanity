import type {CacheTagPrefixes} from './types'

/**
 * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
 */
export const revalidate = 31_536_000 // 365 days

export const cacheTagPrefixes = {
  published: 'sanity:',
  drafts: 'sanity:drafts:',
} satisfies CacheTagPrefixes
