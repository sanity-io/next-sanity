import {syncTagInvalidateEventHandler, type SyncTagInvalidateEventHandler} from '@sanity/functions'
import {encodeSignatureHeader, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

/**
 * How long a single delivery may take before it is abandoned, in milliseconds.
 * Sanity holds the live event until the function calls `done()`, so a hanging origin must not stall the rest.
 * @public
 */
export const defaultDeliveryTimeout: number = 10_000

/**
 * @public
 */
export interface InvalidateSyncTagsOptions {
  /**
   * The shared secret the Next.js route verifies signatures with. Pass the env var directly.
   *
   * @example
   * ```ts
   * secret: process.env.SANITY_REVALIDATE_SECRET
   * ```
   */
  secret: string | undefined
  /**
   * One or more `defineInvalidateSyncTags` route URLs. A string is split on commas, so a single env var can fan out to
   * several deployments.
   *
   * @example
   * ```ts
   * urls: process.env.REVALIDATE_URL
   * // REVALIDATE_URL="https://www.example.com/api/revalidate,https://preview.example.com/api/revalidate"
   * ```
   */
  urls: string | readonly string[] | undefined
  /**
   * Abandon a delivery after this many milliseconds.
   * @defaultValue {@link defaultDeliveryTimeout}
   */
  timeout?: number
  /**
   * Override the `fetch` implementation, mainly for tests.
   * @defaultValue `globalThis.fetch`
   */
  fetch?: typeof globalThis.fetch
}

/**
 * The outcome of delivering the sync tags to one URL.
 * @public
 */
export type SyncTagDelivery =
  | {url: string; ok: true; status: number}
  | {url: string; ok: false; status: number | undefined; error: string}

function parseUrls(urls: InvalidateSyncTagsOptions['urls']): string[] {
  const list = typeof urls === 'string' ? urls.split(',') : (urls ?? [])
  const parsed = list.map((url) => url.trim()).filter(Boolean)
  if (parsed.length === 0) {
    throw new TypeError('`urls` must contain at least one URL', {cause: {urls}})
  }
  for (const url of parsed) {
    if (!URL.canParse(url)) {
      throw new TypeError(`\`urls\` contains an invalid URL: ${url}`, {cause: {urls}})
    }
  }
  return parsed
}

/**
 * Signs `{syncTags}` with `@sanity/webhook` and POSTs it to every URL in parallel.
 * Each delivery succeeds or fails on its own, the returned array has one entry per URL in the order given.
 * Throws only when `secret` or `urls` is missing or malformed, never for a failed delivery.
 *
 * Use this when composing your own `syncTagInvalidateEventHandler`; the one-liner is
 * {@link defineInvalidateSyncTagsHandler}.
 *
 * @public
 */
export async function invalidateSyncTags(
  syncTags: readonly string[],
  options: InvalidateSyncTagsOptions,
): Promise<SyncTagDelivery[]> {
  const {secret, timeout = defaultDeliveryTimeout, fetch = globalThis.fetch} = options
  if (!secret) {
    throw new TypeError('`secret` is required to sign the request')
  }
  const urls = parseUrls(options.urls)

  const body = JSON.stringify({syncTags})
  const signature = await encodeSignatureHeader(body, Date.now(), secret)
  const headers = {'content-type': 'application/json', [SIGNATURE_HEADER_NAME]: signature}

  return Promise.all(
    urls.map(async (url): Promise<SyncTagDelivery> => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(timeout),
        })
        if (response.ok) {
          return {url, ok: true, status: response.status}
        }
        return {url, ok: false, status: response.status, error: await response.text()}
      } catch (error) {
        return {url, ok: false, status: undefined, error: String(error)}
      }
    }),
  )
}

/**
 * Defines a sync tag invalidate Sanity Function that forwards the tags to one or more Next.js deployments using
 * `defineInvalidateSyncTags` from `next-sanity/live/invalidate`, then tells Sanity it is done so the live event is
 * released to `<SanityLive waitFor="function">` clients.
 *
 * Every delivery outcome is logged. Nothing thrown by a delivery, or by missing configuration, escapes the handler,
 * and `done()` is always called, because until it is Sanity holds the event back from every connected browser.
 *
 * @example
 * ```ts
 * // functions/invalidate-sync-tags/index.ts
 *
 * import { defineInvalidateSyncTagsHandler } from "@sanity/next-sanity-functions";
 *
 * export const handler = defineInvalidateSyncTagsHandler({
 *   secret: process.env.SANITY_REVALIDATE_SECRET,
 *   urls: process.env.REVALIDATE_URL,
 * });
 * ```
 *
 * @public
 */
export function defineInvalidateSyncTagsHandler(
  options: InvalidateSyncTagsOptions,
): SyncTagInvalidateEventHandler {
  return syncTagInvalidateEventHandler(async ({event, done}) => {
    const {syncTags} = event.data
    try {
      const deliveries = await invalidateSyncTags(syncTags, options)
      for (const delivery of deliveries) {
        if (delivery.ok) {
          // oxlint-disable-next-line no-console
          console.log(
            `Invalidated ${syncTags.length} sync tags at ${delivery.url}, HTTP ${delivery.status}`,
          )
        } else {
          console.error(
            `Failed to invalidate sync tags at ${delivery.url}${delivery.status === undefined ? '' : `, HTTP ${delivery.status}`}: ${delivery.error}`,
          )
        }
      }
    } catch (error) {
      console.error('Failed to invalidate sync tags, releasing the live event anyway', error)
    } finally {
      try {
        const response = await done(syncTags)
        if (!response.ok) {
          console.error(`Sanity responded with HTTP ${response.status} to done()`)
        }
      } catch (error) {
        console.error('Failed to call done()', error)
      }
    }
  })
}
