/**
 * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
 */
export const revalidate = 7_776_000 // 90 days

export const PUBLISHED_SYNC_TAG_PREFIX = 'sp:'
export const DRAFT_SYNC_TAG_PREFIX = 'sd:'
