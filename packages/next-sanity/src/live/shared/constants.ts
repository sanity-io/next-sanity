import type {CacheTagPrefix} from '#live/types'

// @TODO make this configurable
export const cacheTagPrefix: 'sanity:' = 'sanity:' satisfies CacheTagPrefix

/** The default API host used by @sanity/client when none is specified. */
export const defaultApiHost = 'https://api.sanity.io'

/**
 * Companion cookie set alongside CHIPS-partitioned draft-mode cookies.
 * Presence of this cookie tells later writes (e.g. perspective changes via
 * server actions) to keep using the `Partitioned` attribute.
 *
 * @see https://github.com/sanity-io/sanity/issues/12806
 */
export const partitionedCookieName = 'sanity-preview-partitioned'
