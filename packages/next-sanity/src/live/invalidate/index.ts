import {decodeSignatureHeader, isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {revalidateTag} from 'next/cache'

import {cacheTagPrefix} from '#live/constants'
import {parseTags} from '#live/parseTags'

/**
 * How long a signature stays valid after it was created, in milliseconds.
 * Sanity Functions deliver within seconds, so five minutes leaves room for retries and clock skew.
 * @public
 */
export const defaultSignatureMaxAge: number = 5 * 60 * 1000

/**
 * @public
 */
export interface DefineInvalidateSyncTagsOptions {
  /**
   * The shared secret the sender signs requests with. Pass the env var directly.
   * While it is unset the route responds with `503`.
   *
   * @example
   * ```ts
   * secret: process.env.SANITY_REVALIDATE_SECRET
   * ```
   */
  secret: string | undefined
  /**
   * The route responds `401` to a request whose signature timestamp is older than this many milliseconds.
   * `@sanity/webhook` signatures carry their creation timestamp but do not expire on their own.
   * This window is what stops a captured request from being replayed later.
   * @defaultValue {@link defaultSignatureMaxAge}
   */
  maxAge?: number
  /**
   * The second argument passed to `revalidateTag` for every tag.
   * The default expires cache entries immediately, so the `router.refresh()` that follows the live event renders fresh content on the first try.
   * Pass `'max'` to serve stale content while revalidating in the background instead.
   * @defaultValue `{expire: 0}`
   */
  profile?: Parameters<typeof revalidateTag>[1]
}

/**
 * @public
 */
export interface InvalidateSyncTags {
  POST: (request: Request) => Promise<Response>
}

/**
 * The response body of a successful invalidation.
 * @public
 */
export interface InvalidateSyncTagsResult {
  revalidated: true
  /**
   * The expired cache tags, prefixed the same way `sanityFetch` tags cache entries.
   */
  tags: string[]
}

type Verdict =
  | {ok: true; syncTags: string[]}
  | {ok: false; status: 400 | 401 | 503; message: string}

interface VerifyOptions {
  secret: string | undefined
  maxAge: number
  now: number
}

function reject(status: 400 | 401 | 503, message: string): Verdict {
  return {ok: false, status, message}
}

async function verifyInvalidateRequest(
  rawBody: string,
  signature: string | null,
  {secret, maxAge, now}: VerifyOptions,
): Promise<Verdict> {
  if (!secret) {
    return reject(503, 'The invalidate route has no secret configured')
  }
  if (!signature) {
    return reject(401, `Missing ${SIGNATURE_HEADER_NAME} header`)
  }

  let timestamp: number
  try {
    timestamp = decodeSignatureHeader(signature).timestamp
  } catch {
    return reject(401, 'Malformed signature header')
  }
  if (!(await isValidSignature(rawBody, signature, secret))) {
    return reject(401, 'Invalid signature')
  }
  if (Math.abs(now - timestamp) > maxAge) {
    return reject(401, 'Signature timestamp is outside the accepted window')
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return reject(400, 'Request body must be JSON')
  }
  const syncTags =
    typeof payload === 'object' && payload !== null && 'syncTags' in payload
      ? payload.syncTags
      : undefined
  if (
    !Array.isArray(syncTags) ||
    syncTags.length === 0 ||
    !syncTags.every((tag) => typeof tag === 'string')
  ) {
    return reject(400, '`syncTags` must be a non-empty array of strings')
  }

  return {ok: true, syncTags}
}

/**
 * Returns the `POST` route handler a sync tag invalidate Sanity Function calls before Sanity releases a live event to
 * `<SanityLive waitFor="function">` clients. The handler verifies the `@sanity/webhook` signature on the request.
 * It prefixes the sync tags the same way `sanityFetch` tags cache entries and expires each tag with `revalidateTag`.
 *
 * Pair it with `defineInvalidateSyncTagsHandler` from `@sanity/next-sanity-functions` in the Sanity Function, which
 * signs the payload with the same secret.
 *
 * Responses:
 * - `503` when `secret` is unset
 * - `401` when the signature header is missing, malformed, stale, or does not match
 * - `400` when the body is not JSON or `syncTags` is not a non-empty array of strings
 * - `200` with `{revalidated: true, tags}` after every tag was expired
 *
 * @example
 * ```ts
 * // src/app/api/revalidate/route.ts
 *
 * import { defineInvalidateSyncTags } from "next-sanity/live/invalidate";
 *
 * export const { POST } = defineInvalidateSyncTags({
 *   secret: process.env.SANITY_REVALIDATE_SECRET,
 * });
 * ```
 *
 * @public
 */
export function defineInvalidateSyncTags(
  options: DefineInvalidateSyncTagsOptions,
): InvalidateSyncTags {
  const {secret, maxAge = defaultSignatureMaxAge, profile = {expire: 0}} = options
  return {
    POST: async (request: Request) => {
      const verdict = await verifyInvalidateRequest(
        await request.text(),
        request.headers.get(SIGNATURE_HEADER_NAME),
        {secret, maxAge, now: Date.now()},
      )
      if (!verdict.ok) {
        return Response.json({message: verdict.message}, {status: verdict.status})
      }

      const {tags} = parseTags(verdict.syncTags.map((tag) => `${cacheTagPrefix}${tag}`))
      for (const tag of tags) {
        revalidateTag(tag, profile)
      }

      return Response.json({revalidated: true, tags} satisfies InvalidateSyncTagsResult)
    },
  }
}
