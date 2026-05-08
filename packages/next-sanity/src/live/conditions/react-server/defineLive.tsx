import type {ClientPerspective} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {cookies, draftMode} from 'next/headers'
import {preconnect} from 'react-dom'

import {sanitizePerspective} from '#live/sanitizePerspective'
import type {DefinedFetchType, DefinedLiveProps, DefineLiveOptions} from '#live/types'

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
  const {
    client: _client,
    serverToken,
    browserToken,
    fetchOptions,
    stega: stegaEnabled = true,
  } = config

  if (!_client) {
    throw new Error('`client` is required for `defineLive` to function')
  }

  if (process.env.NODE_ENV !== 'production' && !serverToken && serverToken !== false) {
    console.warn(
      'No `serverToken` provided to `defineLive`. This means that only published content will be fetched and respond to live events. You can silence this warning by setting `serverToken: false`.',
    )
  }

  if (process.env.NODE_ENV !== 'production' && !browserToken && browserToken !== false) {
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
    const stega = _stega ?? (stegaEnabled && studioUrlDefined && (await draftMode()).isEnabled)
    const perspective = _perspective ?? (await resolveCookiePerspective())
    const useCdn = perspective === 'published'
    const revalidate =
      fetchOptions?.revalidate !== undefined
        ? fetchOptions.revalidate
        : process.env.NODE_ENV === 'production'
          ? false
          : undefined
    const isBuildPhase = process.env['NEXT_PHASE'] === PHASE_PRODUCTION_BUILD
    const cacheMode = useCdn && !isBuildPhase ? 'noStale' : undefined

    const {syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective: perspective as ClientPerspective,
      stega: false,
      returnQuery: false,
      next: {revalidate, tags: [...tags, 'sanity:fetch-sync-tags']},
      useCdn,
      cacheMode,
      tag: [requestTag, 'fetch-sync-tags'].filter(Boolean).join('.'),
    })

    const cacheTags = [...tags, ...(syncTags?.map((tag) => `sanity:${tag}`) || [])]

    const {result, resultSourceMap} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective: perspective as ClientPerspective,
      stega,
      token: perspective !== 'published' && serverToken ? serverToken : originalToken,
      next: {revalidate, tags: cacheTags},
      useCdn,
      cacheMode,
      tag: requestTag,
    })
    return {data: result, sourceMap: resultSourceMap || null, tags: cacheTags}
  }

  const SanityLive: React.ComponentType<DefinedLiveProps> = async function SanityLive(props) {
    const {
      includeDrafts = (await draftMode()).isEnabled,
      requestTag = 'next-loader.live',
      waitFor,

      revalidateSyncTags,
      onError,
      intervalOnGoAway,
      onGoAway,

      refreshOnMount,
      refreshOnFocus,
      refreshOnReconnect,
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
        includeDrafts={shouldIncludeDrafts}
        requestTag={requestTag}
        waitFor={shouldWaitFor}
        revalidateSyncTags={revalidateSyncTags}
        onError={onError}
        intervalOnGoAway={intervalOnGoAway}
        onGoAway={onGoAway}
        refreshOnMount={refreshOnMount}
        refreshOnFocus={refreshOnFocus}
        refreshOnReconnect={refreshOnReconnect}
      />
    )
  }
  SanityLive.displayName = 'SanityLiveServerComponent'

  return {sanityFetch, SanityLive}
}

async function resolveCookiePerspective(): Promise<Exclude<ClientPerspective, 'raw'>> {
  return (await draftMode()).isEnabled
    ? (await cookies()).has(perspectiveCookieName)
      ? sanitizePerspective((await cookies()).get(perspectiveCookieName)?.value, 'drafts')
      : 'drafts'
    : 'published'
}
