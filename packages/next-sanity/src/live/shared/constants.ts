import type {CacheTagPrefix} from '#live/types'

/**
 * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
 */
export const revalidate = 31_536_000 // 365 days

// @TODO make this configurable
export const cacheTagPrefix = 'sanity:' satisfies CacheTagPrefix
