import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {revalidateSyncTagsAction} from 'next-sanity/live/server-actions'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {cookies, draftMode} from 'next/headers'

import {cacheTagPrefix} from '#live/constants'
import {preconnect} from '#live/preconnect'
import {resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import {validateStrictFetchOptions, validateStrictSanityLiveProps} from '#live/strictValidation'
import type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  LivePerspective,
  StrictDefinedFetchType,
  StrictDefinedLiveProps,
} from '#live/types'

/**
 * Set up Sanity Live for Cache Components. `defineLive` returns `sanityFetch`
 * and `<SanityLive />`, which connect your Sanity client to the Live Content API
 * so cached pages can update in response to fine-grained content changes.
 *
 * With `strict: true`, `perspective` and `stega` become required
 * `sanityFetch` options, and `includeDrafts` becomes required on
 * `<SanityLive />`. Resolve dynamic values from `draftMode()` and `cookies()`
 * outside `'use cache'` boundaries, then pass them into cached components.
 *
 * @see [Live Content API](https://www.sanity.io/docs/content-lake/live-content-api)
 * @see [Sanity Live](https://www.sanity.io/live)
 *
 * @example
 * ```tsx
 * // sanity/live.ts
 * import {cookies, draftMode} from 'next/headers'
 * import {createClient} from 'next-sanity'
 * import {
 *   defineLive,
 *   resolvePerspectiveFromCookies,
 *   type LivePerspective,
 * } from 'next-sanity/live'
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
 *   strict: true,
 * })
 *
 * export interface DynamicFetchOptions {
 *   perspective: LivePerspective
 *   stega: boolean
 * }
 *
 * // Resolve dynamic values outside 'use cache' boundaries.
 * export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
 *   const {isEnabled: isDraftMode} = await draftMode()
 *   if (!isDraftMode) {
 *     return {perspective: 'published', stega: false}
 *   }
 *
 *   const jar = await cookies()
 *   const perspective = await resolvePerspectiveFromCookies({cookies: jar})
 *   return {perspective: perspective ?? 'drafts', stega: true}
 * }
 * ```
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import {draftMode} from 'next/headers'
 *
 * import {SanityLive} from '@/sanity/live'
 *
 * export default async function RootLayout({children}: {children: React.ReactNode}) {
 *   const {isEnabled: isDraftMode} = await draftMode()
 *
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <SanityLive includeDrafts={isDraftMode} />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // app/[slug]/page.tsx
 * import {draftMode} from 'next/headers'
 * import {Suspense} from 'react'
 * import {defineQuery} from 'next-sanity'
 *
 * import {
 *   getDynamicFetchOptions,
 *   sanityFetch,
 *   type DynamicFetchOptions,
 * } from '@/sanity/live'
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
 *   const {isEnabled: isDraftMode} = await draftMode()
 *   if (isDraftMode) {
 *     return (
 *       <Suspense fallback={<div>Loading...</div>}>
 *         <DynamicPage params={props.params} />
 *       </Suspense>
 *     )
 *   }
 *
 *   const {slug} = await props.params
 *   return <CachedPage slug={slug} perspective="published" stega={false} />
 * }
 *
 * async function DynamicPage(props: Pick<PageProps<'/[slug]'>, 'params'>) {
 *   const {slug} = await props.params
 *   const {perspective, stega} = await getDynamicFetchOptions()
 *
 *   return <CachedPage slug={slug} perspective={perspective} stega={stega} />
 * }
 *
 * async function CachedPage({
 *   slug,
 *   perspective,
 *   stega,
 * }: {slug: string} & DynamicFetchOptions) {
 *   'use cache'
 *
 *   const {data} = await sanityFetch({
 *     query: POST_QUERY,
 *     params: {slug},
 *     perspective,
 *     stega,
 *   })
 *
 *   return <pre>{JSON.stringify(data, null, 2)}</pre>
 * }
 * ```
 *
 * @public
 */
export function defineLive(config: DefineLiveOptions & {strict: true}): {
  sanityFetch: StrictDefinedFetchType
  SanityLive: React.ComponentType<StrictDefinedLiveProps>
}
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
export function defineLive(config: DefineLiveOptions & {strict?: false}): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
export function defineLive(config: DefineLiveOptions) {
  const {client: _client, serverToken, browserToken, strict = false} = config

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

  const client = _client.withConfig({
    allowReconfigure: false,
    useCdn: true,
    perspective: 'published',
    stega: false,
  })
  const studioUrlDefined = typeof client.config().stega.studioUrl !== 'undefined'

  const sanityFetch: DefinedFetchType = async function sanityFetch({
    query,
    params = {},
    perspective: _perspective,
    stega: _stega,
    tags = [],
    requestTag = 'next-loader.fetch',
  }) {
    if (strict) {
      validateStrictFetchOptions({perspective: _perspective, stega: _stega})
    }
    const stega = strict
      ? _stega
      : (_stega ?? (serverToken && studioUrlDefined ? (await draftMode()).isEnabled : false))
    const perspective = strict
      ? _perspective
      : (_perspective ?? (serverToken ? await resolveCookiePerspective() : undefined))
    const useCdn = perspective ? perspective === 'published' : undefined
    const isBuildPhase = process.env['NEXT_PHASE'] === PHASE_PRODUCTION_BUILD
    const cacheMode = useCdn !== false && !isBuildPhase ? 'noStale' : undefined
    const token =
      ((perspective && perspective !== 'published') || stega) && serverToken
        ? serverToken
        : undefined

    // 1. Fetch the tags first, with an uncached request, but that does not count towards the Sanity API quota
    const {syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective,
      stega: false,
      resultSourceMap: false,
      returnQuery: false,
      useCdn,
      cacheMode,
      tag: [requestTag, 'fetch-sync-tags'].filter(Boolean).join('.'),
      token,
    })

    const cacheTags = [...tags, ...(syncTags?.map((tag) => `${cacheTagPrefix}${tag}`) || [])]

    // 2. Then fetch the data, using the fetch cache with specified tags
    const {result, resultSourceMap} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective,
      stega,
      next: {revalidate: false, tags: cacheTags},
      useCdn,
      cacheMode,
      tag: requestTag,
      token,
    })
    return {data: result, sourceMap: resultSourceMap || null, tags: cacheTags}
  }

  const SanityLive: React.ComponentType<DefinedLiveProps> = async function SanityLive(props) {
    if (strict) {
      validateStrictSanityLiveProps(props)
    }
    const {
      includeDrafts: _includeDrafts,
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

    const includeDrafts =
      typeof browserToken === 'string' &&
      !!browserToken &&
      (_includeDrafts ?? (await draftMode()).isEnabled)
    const shouldWaitFor = waitFor === 'function' && !includeDrafts ? waitFor : undefined

    // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    preconnect(client)

    return (
      <SanityLiveClientComponent
        config={{
          projectId,
          dataset,
          apiHost: apiHost === 'https://api.sanity.io' ? undefined : apiHost,
          apiVersion,
          useProjectHostname: useProjectHostname ? undefined : useProjectHostname,
          requestTagPrefix,
          token: includeDrafts ? browserToken : undefined,
        }}
        includeDrafts={includeDrafts ? true : undefined}
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

async function resolveCookiePerspective(): Promise<LivePerspective | undefined> {
  return (await draftMode()).isEnabled
    ? await resolvePerspectiveFromCookies({cookies: await cookies()})
    : undefined
}
