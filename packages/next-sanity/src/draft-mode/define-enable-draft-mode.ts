import {validatePreviewUrl} from '@sanity/preview-url-secret'
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
      // const {cookies, draftMode} = await import('next/headers.js')
      // const {redirect} = await import('next/navigation.js')

      // eslint-disable-next-line no-warning-comments
      // @TODO check if already in draft mode at a much earlier stage, and skip validation

      const {isValid, redirectTo = '/'} = await validatePreviewUrl(client, request.url)
      if (!isValid) {
        return new Response('Invalid secret', {status: 401})
      }

      const {isEnabled, enable} = await draftMode()

      // Let's enable draft mode if it's not already enabled
      if (!isEnabled) {
        enable()
      }

      // Override cookie header for draft mode for usage in live-preview
      // https://github.com/vercel/next.js/issues/49927
      const {get, set} = await cookies()
      const cookie = get('__prerender_bypass')!
      set({
        name: '__prerender_bypass',
        value: cookie?.value,
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: 'none',
      })

      // the `redirect` function throws, and eventually returns a Promise<Response>. TSC doesn't "see" that so we have to tell it
      return redirect(redirectTo) as Promise<Response>
    },
  }
}
