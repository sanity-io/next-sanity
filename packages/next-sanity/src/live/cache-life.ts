/**
 * For usage with `cacheComponents: true`, and `defineLive`:
 * ```ts
 * // next.config.ts
 *
 * import type {NextConfig} from 'next'
 * import {sanity} from 'next-sanity/live/cache-life'
 *
 * const nextConfig: NextConfig = {
 *   cacheComponents: true,
 *   cacheLife: {
 *     default: sanity,
 *   }
 * }
 *
 * export default nextConfig
 * ```
 */
export const sanity: {
  readonly revalidate: 31_536_000;
} = {
  /**
   * Sanity Live handles on-demand revalidation, so the default 15min time-based revalidation is too short
   */
  revalidate: 31_536_000, // 365 days
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
