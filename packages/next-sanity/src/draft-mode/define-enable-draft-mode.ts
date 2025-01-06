import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {cookies, draftMode} from 'next/headers'
import {redirect} from 'next/navigation'

import type {SanityClient} from '../client'

/**
 * @public
 */
export interface DefineEnableDraftModeOptions {
  client: SanityClient
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
      // eslint-disable-next-line no-warning-comments
      // @TODO check if already in draft mode at a much earlier stage, and skip validation

      const {
        isValid,
        redirectTo = '/',
        studioPreviewPerspective,
      } = await validatePreviewUrl(client, request.url)
      if (!isValid) {
        return new Response('Invalid secret', {status: 401})
      }

      const draftModeStore = await draftMode()

      // Let's enable draft mode if it's not already enabled
      if (!draftModeStore.isEnabled) {
        draftModeStore.enable()
      }

      const dev = process.env.NODE_ENV !== 'production'

      // Override cookie header for draft mode for usage in live-preview
      // https://github.com/vercel/next.js/issues/49927
      const cookieStore = await cookies()
      const cookie = cookieStore.get('__prerender_bypass')!
      cookieStore.set({
        name: '__prerender_bypass',
        value: cookie?.value,
        httpOnly: true,
        path: '/',
        secure: !dev,
        sameSite: dev ? 'lax' : 'none',
      })

      if (studioPreviewPerspective) {
        cookieStore.set({
          name: perspectiveCookieName,
          value: studioPreviewPerspective,
          httpOnly: true,
          path: '/',
          secure: !dev,
          sameSite: dev ? 'lax' : 'none',
        })
      }

      // the `redirect` function throws, and eventually returns a Promise<Response>. TSC doesn't "see" that so we have to tell it
      return redirect(redirectTo) as Promise<Response>
    },
  }
}
