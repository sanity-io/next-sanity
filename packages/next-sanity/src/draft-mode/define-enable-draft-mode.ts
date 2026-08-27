import type {SanityClient} from '@sanity/client'
import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {perspectiveCookieName, variantCookieName} from '@sanity/preview-url-secret/constants'
import {cookies, draftMode} from 'next/headers'
import {redirect} from 'next/navigation'

import {partitionedCookieName} from '#live/constants'

import {
  cookieCheckSearchParam,
  probeSearchParam,
  renderCookieAccessInterstitial,
} from './cookie-access-fallback'

/**
 * @public
 */
export interface DefineEnableDraftModeOptions {
  client: SanityClient
  /**
   * Force secure cookies in development mode.
   * Enable this when using Next.js --experimental-https flag.
   * This option has no effect in production (cookies are always secure).
   * @defaultValue false
   */
  secureDevMode?: boolean
}

/**
 * @public
 */
export interface EnableDraftMode {
  GET: (request: Request) => Promise<Response>
}

/**
 * Sets up an API route for enabling draft mode, can be paired with the `previewUrl.previewMode.enable` in `sanity/presentation`.
 * Can also be used with `sanity-plugin-iframe-pane`.
 *
 * When the preview loads in a cross-site iframe (Presentation Tool), draft-mode
 * cookies are set with the CHIPS `Partitioned` attribute so Safari 18.4+ stores
 * them despite third-party cookie blocking. Top-level / same-site requests keep
 * unpartitioned cookies so `draftMode().disable()` continues to work.
 *
 * Some browsers reject even `Partitioned` cookies in cross-site iframes, for
 * example Firefox with Enhanced Tracking Protection configured to block all
 * third-party cookies ("Cookie has been rejected as third-party"). Because a
 * silent redirect would then land on a preview that can never enter draft
 * mode, cross-site iframe requests are redirected back to this route once with
 * a probe search param to verify the cookies were stored. If they were not,
 * the route responds with an interstitial that requests unpartitioned cookie
 * access through the Storage Access API and retries, or explains how to
 * unblock the preview when the browser refuses. Requests that carry the
 * `Sec-Fetch-Storage-Access: inactive` header are asked to retry with the
 * already-granted permission activated (Storage Access Headers).
 *
 * @see https://github.com/sanity-io/sanity/issues/12806
 * @see https://github.com/sanity-io/next-sanity/issues/3919
 *
 * @example
 * ```ts
 * // src/app/api/draft-mode/enable/route.ts
 *
 * import { defineEnableDraftMode } from "next-sanity/draft-mode";
 * import { client } from "@/sanity/lib/client";
 *
 * export const { GET } = defineEnableDraftMode({
 *   client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
 * });
 * ```
 *
 * @public
 */
export function defineEnableDraftMode(options: DefineEnableDraftModeOptions): EnableDraftMode {
  const {client} = options
  return {
    GET: async (request: Request) => {
      const {
        isValid,
        redirectTo = '/',
        studioOrigin,
        studioPreviewPerspective,
        studioPreviewVariant,
      } = await validatePreviewUrl(client, request.url)
      if (!isValid) {
        return new Response('Invalid secret', {status: 401})
      }

      const draftModeStore = await draftMode()

      // A valid bypass cookie on the request proves the browser stores and
      // sends the draft-mode cookies in this context.
      const hasBypassCookie = draftModeStore.isEnabled

      const isProduction = process.env.NODE_ENV === 'production'

      // We can't auto-detect HTTPS in dev due to Next.js limitations,
      // so we need an explicit option
      const isSecure = isProduction || (options.secureDevMode ?? false)

      const fetchDest = request.headers.get('sec-fetch-dest')
      const fetchSite = request.headers.get('sec-fetch-site')
      const storageAccess = request.headers.get('sec-fetch-storage-access')

      const url = new URL(request.url)
      const probedAttempt = Number.parseInt(url.searchParams.get(probeSearchParam) ?? '', 10)
      const isProbe = Number.isInteger(probedAttempt) && probedAttempt >= 1
      const isCookieCheck = url.searchParams.has(cookieCheckSearchParam)

      // The interstitial retries with `location.replace`, which is initiated
      // by the embed itself. Fetch metadata then reports `same-origin` even
      // though the iframe is still a third-party Presentation embed. Keep
      // those navigations in this fallback when they carry the probe param.
      const crossSiteIframe =
        isSecure &&
        fetchDest === 'iframe' &&
        (fetchSite === 'cross-site' || (fetchSite === 'same-origin' && isProbe))

      // Storage Access Headers: `inactive` means the browser has already
      // granted the `storage-access` permission but did not activate it for
      // this navigation. Once a probe has proven that the partitioned cookies
      // were rejected, ask the browser to retry the request with the
      // permission active so the cookies below are stored in, and read from,
      // the unpartitioned jar. Supporting browsers retry at most once. The
      // first, un-probed attempt is deliberately excluded: CHIPS partitioned
      // cookies are the reliable default for cross-site iframes, and a stale
      // permission grant must not divert cookies into the unpartitioned jar
      // in browsers where the partitioned jar works fine.
      if (
        crossSiteIframe &&
        !hasBypassCookie &&
        storageAccess === 'inactive' &&
        isProbe &&
        !isCookieCheck
      ) {
        return new Response(renderCookieAccessInterstitial({attempt: probedAttempt}), {
          status: 401,
          headers: {
            'Activate-Storage-Access': `retry; allowed-origin=${studioOrigin ? `"${studioOrigin}"` : '*'}`,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            'Vary': 'Sec-Fetch-Storage-Access',
          },
        })
      }

      // Let's enable draft mode if it's not already enabled
      if (!draftModeStore.isEnabled) {
        draftModeStore.enable()
      }

      // Safari blocks unpartitioned third-party cookies. When the enable route is
      // hit from a cross-site iframe (Presentation), opt into CHIPS so the cookies
      // are stored under the studio's partition. Skip partitioning for top-level /
      // same-site requests so draftMode().disable() can still clear them. Skip it
      // as well when storage access is active for this request: those cookies
      // belong in the unpartitioned jar the Storage Access API just unblocked -
      // `Partitioned` would put them back in the jar the browser is blocking.
      // https://github.com/sanity-io/sanity/issues/12806
      // Same-origin interstitial retries happen after `requestStorageAccess()`
      // and must use the unpartitioned jar. Firefox does not send
      // `Sec-Fetch-Storage-Access: active`, so infer the grant from the
      // same-origin iframe navigation itself.
      const partitioned =
        crossSiteIframe && storageAccess !== 'active' && fetchSite !== 'same-origin'

      // Override cookie header for draft mode for usage in live-preview
      // https://github.com/vercel/next.js/issues/49927
      const cookieStore = await cookies()
      const cookie = cookieStore.get('__prerender_bypass')!
      cookieStore.set({
        name: '__prerender_bypass',
        value: cookie?.value,
        httpOnly: true,
        path: '/',
        secure: isSecure,
        sameSite: isSecure ? 'none' : 'lax',
        partitioned,
      })

      if (studioPreviewPerspective) {
        cookieStore.set({
          name: perspectiveCookieName,
          value: studioPreviewPerspective,
          httpOnly: true,
          path: '/',
          secure: isSecure,
          sameSite: isSecure ? 'none' : 'lax',
          partitioned,
        })
      }

      if (studioPreviewVariant) {
        cookieStore.set({
          name: variantCookieName,
          value: studioPreviewVariant,
          httpOnly: true,
          path: '/',
          secure: isSecure,
          sameSite: isSecure ? 'none' : 'lax',
          partitioned,
        })
      } else {
        // Unlike perspective, the variant is optional on the enable URL. Entering
        // preview without a variant must clear any stale variant cookie from a
        // previous session, passing matching attributes so partitioned cookies
        // are actually removed.
        cookieStore.delete({
          name: variantCookieName,
          httpOnly: true,
          path: '/',
          secure: isSecure,
          sameSite: isSecure ? 'none' : 'lax',
          partitioned,
        })
      }

      // Persist the partitioning decision for later writes (server actions have no
      // Sec-Fetch iframe signal). The flag cookie is itself partitioned, so it is
      // only visible inside the same cross-site iframe context.
      if (partitioned) {
        cookieStore.set({
          name: partitionedCookieName,
          value: '1',
          httpOnly: true,
          path: '/',
          secure: true,
          sameSite: 'none',
          partitioned: true,
        })
      } else if (crossSiteIframe) {
        // Storage access is active, so the cookies above are unpartitioned.
        // Clear a stale flag cookie so server actions stop partitioning writes.
        cookieStore.delete({
          name: partitionedCookieName,
          httpOnly: true,
          path: '/',
          secure: true,
          sameSite: 'none',
          partitioned: true,
        })
      }

      // Browsers with strict tracking protection can reject all of the cookies
      // set above, even with `Partitioned`, and there is no server-side signal
      // for it. Unless this request proves cookies already work, redirect back
      // to this route once so the next request reveals whether they stuck.
      if (crossSiteIframe && !hasBypassCookie) {
        if (!isProbe) {
          url.searchParams.delete(cookieCheckSearchParam)
          url.searchParams.set(probeSearchParam, '1')
          redirect(`${url.pathname}${url.search}`)
        }

        // `active` (Storage Access Headers retry) and same-origin interstitial
        // retries arrive cookieless because the previous response stored no
        // cookies. They are new Set-Cookie attempts, not failed probes —
        // verify the cookies just written before showing the interstitial.
        const isUnpartitionedWrite = storageAccess === 'active' || fetchSite === 'same-origin'
        if (isUnpartitionedWrite && !isCookieCheck) {
          url.searchParams.set(cookieCheckSearchParam, '1')
          redirect(`${url.pathname}${url.search}`)
        }

        // The probe request came back without the cookie: the browser rejected
        // it. Serve the Storage Access API interstitial instead of a preview
        // that can never enter draft mode.
        return new Response(renderCookieAccessInterstitial({attempt: probedAttempt}), {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      }

      return redirect(redirectTo)
    },
  }
}
