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
  revalidate: 7_776_000, // 90 days,
} as const satisfies {
  /**
   * This cache may be stale on clients for ... seconds before checking with the server.
   */
  stale?: number
  /**
   * If the server receives a new request after ... seconds, start revalidating new values in the background.
   */
  revalidate?: number
  /**
   * If this entry has no traffic for ... seconds it will expire. The next request will recompute it.
   */
  expire?: number
}
