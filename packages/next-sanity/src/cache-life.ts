import { revalidate } from "#live/constants"

/**
 * For usage with `cacheComponents: true`, and `defineLive`:
 * ```ts
 * // next.config.ts
 *
 * import type {NextConfig} from 'next'
 * import {sanity} from 'next-sanity/cache-life'
 *
 * const nextConfig: NextConfig = {
 *   cacheComponents: true,
 *   cacheLife: {
 *     sanity
 *   }
 * }
 *
 * export default nextConfig
 * ```
 *
 * ```ts
 *
 * async function sanityFetch() {
 *   'use cache'
 *    cacheLife('sanity')
 *    const {data} = await fetch({query, params})
 *    return data
 * }
 */
export const sanity = {
  /**
   * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
   */
  revalidate: 7_776_000,
} as const satisfies {
  /**
   * This cache may be stale on clients for ... seconds before checking with the server.
   */
  stale?: number
  /**
   * If the server receives a new request after ... seconds, start revalidating new values in the background.
   */
  revalidate?: typeof revalidate
  /**
   * If this entry has no traffic for ... seconds it will expire. The next request will recompute it.
   */
  expire?: number
}
