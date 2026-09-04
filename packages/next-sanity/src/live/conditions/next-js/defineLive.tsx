import {sanity as sanityCacheLife} from 'next-sanity/live/cache-life'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {revalidateSyncTagsAction} from 'next-sanity/live/server-actions'
import {cacheLife, cacheTag} from 'next/cache'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {draftMode} from 'next/headers'

import {cacheTagPrefix, defaultApiHost} from '#live/constants'
import {preconnect} from '#live/preconnect'
import {
  resolveFetchOptions,
  resolverSource,
  type ResolveFetchOptionsConfig,
} from '#live/resolveFetchOptions'
import type {DefinedFetchType, DefinedLiveProps, DefineLiveOptions} from '#live/types'

/**
 * Set up Sanity Live. `defineLive` returns `sanityFetch` and `<SanityLive />`,
 * which connect your Sanity client to the Live Content API so pages can serve
 * cached content and update in response to fine-grained content changes.
 *
 * `draftMode()` decides the defaults. Outside draft mode `sanityFetch` fetches
 * `perspective: 'published'` with no stega and no variant, and `<SanityLive />`
 * leaves `includeDrafts` off. Inside draft mode stega defaults on when the
 * client has `stega.studioUrl`, `<SanityLive />` includes drafts, and the
 * perspective comes from the `perspective` resolver you hand `defineLive`.
 * Without a resolver it comes from the Presentation Tool cookie when
 * `cacheComponents` is off and is `'drafts'` when it is on, because `cookies()`
 * cannot be read inside `'use cache'`. An explicit option always wins, in
 * either direction: `stega: false` stays off inside draft mode and
 * `perspective: 'drafts'` is honoured outside it.
 *
 * The resolver is usually the `[perspective]` root param getter from
 * `next/root-params`, with `definePerspectiveProxy` from
 * `next-sanity/live/proxy` rewriting requests into the `/[perspective]/...`
 * route tree. With a resolver `sanityFetch` never reads cookies, so it behaves
 * the same with `cacheComponents` on or off. `draftMode()` and root params are
 * both allowed inside `'use cache'`.
 *
 * `sanityFetch` brands `data` with stega string types unless you pass the
 * literal `stega: false`. Use `stegaClean` before comparing branded strings to
 * literals.
 *
 * @see [Live Content API](https://www.sanity.io/docs/content-lake/live-content-api)
 * @see [Sanity Live](https://www.sanity.io/live)
 *
 * @example
 * ```tsx
 * // sanity/live.ts
 * import {createClient} from 'next-sanity'
 * import {defineLive} from 'next-sanity/live'
 * import {perspective} from 'next/root-params'
 *
 * const client = createClient({
 *   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
 *   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
 *   useCdn: true,
 *   perspective: 'published',
 *   stega: {studioUrl: '/studio'},
 * })
 * const token = process.env.SANITY_API_READ_TOKEN
 *
 * export const {sanityFetch, SanityLive} = defineLive({
 *   client,
 *   browserToken: token,
 *   serverToken: token,
 *   perspective,
 * })
 * ```
 *
 * @example
 * ```ts
 * // proxy.ts
 * import {definePerspectiveProxy} from 'next-sanity/live/proxy'
 *
 * export const proxy = definePerspectiveProxy()
 *
 * // Next.js needs the matcher as a literal in this file.
 * export const config = {
 *   matcher: ['/((?!_next|_vercel|api|studio|favicon|\\.well-known|robots\\.|sitemap\\.|[^/]*\\.).*)?'],
 * }
 * ```
 *
 * @example
 * ```tsx
 * // app/[perspective]/layout.tsx
 * import {SanityLive} from '@/sanity/live'
 *
 * export async function generateStaticParams() {
 *   return [{perspective: 'published'}]
 * }
 *
 * export default function RootLayout({children}: LayoutProps<'/[perspective]'>) {
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
 * // app/[perspective]/[slug]/page.tsx
 * import {Suspense} from 'react'
 * import {defineQuery} from 'next-sanity'
 *
 * import {sanityFetch} from '@/sanity/live'
 *
 * const POST_QUERY = defineQuery(`
 *   *[_type == "post" && slug.current == $slug][0]
 * `)
 *
 * export default function Page({params}: PageProps<'/[perspective]/[slug]'>) {
 *   return (
 *     <Suspense fallback={<div>Loading...</div>}>
 *       {params.then(({slug}) => <CachedPage slug={slug} />)}
 *     </Suspense>
 *   )
 * }
 *
 * async function CachedPage({slug}: {slug: string}) {
 *   'use cache'
 *   const {data} = await sanityFetch({query: POST_QUERY, params: {slug}})
 *
 *   return <pre>{JSON.stringify(data, null, 2)}</pre>
 * }
 * ```
 *
 * @example
 * Without a `[perspective]` segment, leave the resolver off. Outside draft mode
 * nothing changes. Inside draft mode the perspective comes from the cookie when
 * `cacheComponents` is off and is `'drafts'` when it is on.
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
 *   const {data} = await sanityFetch({query: POST_QUERY, params: {slug}})
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
  const {client: _client, serverToken, browserToken, perspective: resolvePerspective} = config

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
  const fetchOptionsConfig: ResolveFetchOptionsConfig = {
    serverToken,
    studioUrlDefined: typeof client.config().stega.studioUrl !== 'undefined',
    draft: resolverSource(resolvePerspective),
  }

  const sanityFetch: DefinedFetchType = async function sanityFetch({
    query,
    params = {},
    perspective: _perspective,
    variant: _variant,
    stega: _stega,
    tags: customCacheTags = [],
    requestTag = 'next-loader.fetch.cache-components',
  }) {
    const {perspective, variant, stega} = await resolveFetchOptions(
      {perspective: _perspective, variant: _variant, stega: _stega},
      fetchOptionsConfig,
    )

    const useCdn = perspective === 'published'
    const isBuildPhase = process.env['NEXT_PHASE'] === PHASE_PRODUCTION_BUILD
    const cacheMode = useCdn && !isBuildPhase ? 'noStale' : undefined
    const token = (!useCdn || stega) && serverToken ? serverToken : undefined

    const {result, resultSourceMap, syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective,
      variant,
      stega,
      returnQuery: false,
      useCdn,
      cacheMode,
      tag: requestTag,
      token,
    })
    const tags = [...customCacheTags, ...(syncTags || []).map((tag) => `${cacheTagPrefix}${tag}`)]
    /**
     * The tags used here, are expired later on in the `action` Server Action given to `<SanityLive />` with the `revalidateTag` function from `next/cache`,
     * or by a route handler that userland sets up.
     */
    cacheTag(...tags)
    /**
     * Sanity Live handles on-demand revalidation, so the default 15min time-based revalidation is too short,
     * userland can still set a shorter revalidate time by calling `cacheLife` themselves.
     */
    cacheLife(sanityCacheLife)

    return {data: result, sourceMap: resultSourceMap || null, tags}
  }

  const SanityLive: React.ComponentType<DefinedLiveProps> = async function SanityLive(props) {
    const {
      includeDrafts: _includeDrafts,
      requestTag = 'next-loader.live.cache-components',
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
          apiHost: apiHost === defaultApiHost ? undefined : apiHost,
          apiVersion,
          useProjectHostname: useProjectHostname ? undefined : useProjectHostname,
          requestTagPrefix,
          token: includeDrafts ? browserToken : undefined,
        }}
        includeDrafts={includeDrafts ? true : undefined}
        requestTag={requestTag}
        waitFor={shouldWaitFor}
        action={
          action ??
          (shouldWaitFor === 'function' || includeDrafts ? 'refresh' : revalidateSyncTagsAction)
        }
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
