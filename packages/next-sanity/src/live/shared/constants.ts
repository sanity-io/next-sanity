import type {CacheTagPrefix} from '#live/types'

// @TODO make this configurable
export const cacheTagPrefix = 'sanity:' satisfies CacheTagPrefix

/** The default API host used by @sanity/client when none is specified. */
export const defaultApiHost = 'https://api.sanity.io'
