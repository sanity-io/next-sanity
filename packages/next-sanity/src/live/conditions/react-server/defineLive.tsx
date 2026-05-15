import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {revalidateSyncTagsAction} from 'next-sanity/live/server-actions'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {cookies, draftMode} from 'next/headers'
import {preconnect} from 'react-dom'

import {cacheTagPrefix} from '#live/constants'
import {resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  LivePerspective,
} from '#live/types'

/**
 * Set up Sanity Live. `defineLive` returns `sanityFetch` and `<SanityLive />`,
 * which connect your Sanity client to the Live Content API so pages can serve
 * cached content and update in response to fine-grained content changes.
 *
 * @see [Live Content API](https://www.sanity.io/docs/content-lake/live-content-api)
 * @see [Sanity Live](https://www.sanity.io/live)
 *
 * @example
 * ```tsx
 * import {createClient} from 'next-sanity'
 * import {defineLive} from 'next-sanity/live'
 *
 * const client = createClient({
 *   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
 *   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
 *   useCdn: true,
 *   perspective: 'published',
 * })
 * const token = process.env.SANITY_API_READ_TOKEN
 *
 * export const {sanityFetch, SanityLive} = defineLive({
 *   client,
 *   browserToken: token,
 *   serverToken: token,
 * })
 * ```
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import {SanityLive} from '@/sanity/live'
 *
 * export default function RootLayout({children}: {children: React.ReactNode}) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <SanityLive />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // app/[slug]/page.tsx
 * import {defineQuery} from 'next-sanity'
 * import {sanityFetch} from '@/sanity/live'
 *
 * const POSTS_SLUGS_QUERY = defineQuery(`
 *   *[_type == "post" && slug.current]{"slug": slug.current}
 * `)
 * const POST_QUERY = defineQuery(`
 *   *[_type == "post" && slug.current == $slug][0]
 * `)
 *
 * export async function generateStaticParams() {
 *   const {data} = await sanityFetch({
 *     query: POSTS_SLUGS_QUERY,
 *     perspective: 'published',
 *     stega: false,
 *   })
 *
 *   return data
 * }
 *
 * export default async function Page(props: PageProps<'/[slug]'>) {
 *   const {slug} = await props.params
 *   const {data} = await sanityFetch({
 *     query: POST_QUERY,
 *     params: {slug},
 *   })
 *
 *   return <pre>{JSON.stringify(data, null, 2)}</pre>
 * }
 * ```
 *
 * @public
 */
export function defineLive(config: DefineLiveOptions): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
} {
  const {client: _client, serverToken, browserToken} = config

  if (!_client) {
    throw new Error('`client` is required for `defineLive` to function')
  }

  if (process.env.NODE_ENV === 'development' && !serverToken && serverToken !== false) {
    console.warn(
      'No `serverToken` provided to `defineLive`. This means that only published content will be fetched and respond to live events. You can silence this warning by setting `serverToken: false`.',
    )
  }

  if (process.env.NODE_ENV === 'development' && !browserToken && browserToken !== false) {
    console.warn(
      'No `browserToken` provided to `defineLive`. This means that live previewing drafts will only work when using the Presentation Tool in your Sanity Studio. To support live previewing drafts stand-alone, provide a `browserToken`. It is shared with the browser so it should only have Viewer rights or lower. You can silence this warning by setting `browserToken: false`.',
    )
  }

  const client = _client.withConfig({allowReconfigure: false, useCdn: false})
  const {token: originalToken} = client.config()
  const studioUrlDefined = typeof client.config().stega.studioUrl !== 'undefined'

  const sanityFetch: DefinedFetchType = async function sanityFetch({
    query,
    params = {},
    stega: _stega,
    tags = [],
    perspective: _perspective,
    requestTag = 'next-loader.fetch',
  }) {
    const stega =
      _stega ?? (serverToken && studioUrlDefined ? (await draftMode()).isEnabled : false)
    const perspective =
      _perspective ?? (serverToken ? await resolveCookiePerspective() : 'published')
    const useCdn = perspective === 'published'
    const revalidate = false
    const isBuildPhase = process.env['NEXT_PHASE'] === PHASE_PRODUCTION_BUILD
    const cacheMode = useCdn && !isBuildPhase ? 'noStale' : undefined
    const token =
      (perspective !== 'published' || stega) && serverToken ? serverToken : originalToken

    const {syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective,
      stega: false,
      resultSourceMap: false,
      returnQuery: false,
      next: {revalidate, tags: [...tags, `${cacheTagPrefix}fetch-sync-tags`]},
      useCdn,
      cacheMode,
      tag: [requestTag, 'fetch-sync-tags'].filter(Boolean).join('.'),
      token,
    })

    const cacheTags = [...tags, ...(syncTags?.map((tag) => `${cacheTagPrefix}${tag}`) || [])]

    const {result, resultSourceMap} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective,
      stega,
      next: {revalidate, tags: cacheTags},
      useCdn,
      cacheMode,
      tag: requestTag,
      token,
    })
    return {data: result, sourceMap: resultSourceMap || null, tags: cacheTags}
  }

  const SanityLive: React.ComponentType<DefinedLiveProps> = async function SanityLive(props) {
    const {
      includeDrafts = typeof browserToken === 'string' && !!browserToken
        ? (await draftMode()).isEnabled
        : false,
      requestTag = 'next-loader.live',
      waitFor,

      action,
      onError,
      onWelcome,
      onReconnect,
      onRestart,
      onGoAway,
    } = props
    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()

    const shouldIncludeDrafts = typeof browserToken === 'string' && includeDrafts
    const shouldWaitFor = waitFor === 'function' && !shouldIncludeDrafts ? waitFor : undefined

    // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    const {origin} = new URL(client.getUrl('', false))
    preconnect(origin)

    return (
      <SanityLiveClientComponent
        config={{
          projectId,
          dataset,
          apiHost,
          apiVersion,
          useProjectHostname,
          requestTagPrefix,
          token: shouldIncludeDrafts ? browserToken : undefined,
        }}
        includeDrafts={shouldIncludeDrafts ? true : undefined}
        requestTag={requestTag}
        waitFor={shouldWaitFor}
        action={action ?? (shouldWaitFor === 'function' ? 'refresh' : revalidateSyncTagsAction)}
        onError={onError}
        onWelcome={onWelcome}
        onReconnect={onReconnect}
        onRestart={onRestart}
        onGoAway={onGoAway}
      />
    )
  }
  SanityLive.displayName = 'SanityLiveServerComponent'

  return {sanityFetch, SanityLive}
}

async function resolveCookiePerspective(): Promise<LivePerspective> {
  return (await draftMode()).isEnabled
    ? await resolvePerspectiveFromCookies({cookies: await cookies()})
    : 'published'
}
