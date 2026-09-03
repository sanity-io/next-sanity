import type {ClientReturn, QueryParams} from 'next-sanity'
import {sanity as sanityCacheLife} from 'next-sanity/live/cache-life'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {revalidateSyncTagsAction} from 'next-sanity/live/server-actions'
import {cacheLife, cacheTag} from 'next/cache'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {draftMode} from 'next/headers'

import {cacheTagPrefix, defaultApiHost} from '#live/constants'
import {preconnect} from '#live/preconnect'
import {resolveStrictFetchOptions} from '#live/resolveStrictFetchOptions'
import type {
  DefinedFetchMetadataType,
  DefinedFetchResult,
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  LivePerspective,
  LivePerspectiveResolver,
  StrictDefinedFetchMetadataType,
  StrictDefinedFetchType,
} from '#live/types'

/**
 * A `'use cache'` function serializes every binding it closes over into its
 * cache key, and `sanityFetch` closes over the client and the tokens. The
 * registry keeps them out of the key by handing the cached function a string
 * id instead. Two `defineLive` calls with the same client config, token,
 * strict flag, and resolver name share an entry, which is also what their
 * fetches would return.
 */
const fetchers = new Map<string, DefinedFetchType>()

/**
 * FNV-1a over the token, rendered as hex. Separates two `defineLive` calls
 * that differ only by `serverToken` without putting the secret in the
 * registry id, which the `'use cache'` key serializes.
 */
function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16)
}

function registerFetcher(id: string, sanityFetch: DefinedFetchType): string {
  fetchers.set(id, sanityFetch)
  return id
}

async function cachedMetadataFetch<const QueryString extends string>(
  fetcherId: string,
  query: QueryString,
  params: QueryParams,
  perspective: LivePerspective | undefined,
  tags: string[] | undefined,
  requestTag: string | undefined,
): DefinedFetchResult<ClientReturn<QueryString, unknown>> {
  'use cache'
  const sanityFetch = fetchers.get(fetcherId)
  if (!sanityFetch) {
    throw new Error(
      `sanityFetchMetadata() called before defineLive() registered fetcher ${fetcherId}`,
    )
  }
  return sanityFetch({query, params, perspective, stega: false, tags, requestTag})
}

/**
 * Set up Sanity Live for Cache Components. `defineLive` returns `sanityFetch`
 * and `<SanityLive />`, which connect your Sanity client to the Live Content API
 * so cached pages can update in response to fine-grained content changes.
 *
 * With `strict: true`, draft mode is the single source of truth. `sanityFetch`
 * reads `draftMode()` itself, which Next.js allows inside `'use cache'`
 * scopes. Outside draft mode every fetch is forced to `perspective: 'published'`
 * with `stega: false`. Inside draft mode `stega` defaults to `true` and the
 * perspective comes from the `perspective` resolver you hand `defineLive`.
 * Pass the `[perspective]` root param getter from `next/root-params` and let
 * `definePerspectiveProxy` from `next-sanity/live/proxy` rewrite requests into
 * the `/[perspective]/...` route tree. `<SanityLive />` derives `includeDrafts`
 * from `draftMode()` the same way. Cookies are never read.
 *
 * `sanityFetch` brands `data` with stega string types unless you pass the
 * literal `stega: false`. Use `stegaClean` before comparing branded strings to
 * literals. `sanityFetchMetadata` is `sanityFetch` with `stega` fixed to
 * `false` for `generateMetadata` and the file-based metadata routes, where the
 * data never renders next to `<VisualEditing />`. With Cache Components, two
 * `defineLive` calls with the same client config, `serverToken`, `strict`
 * flag, and `perspective` resolver name share one `sanityFetchMetadata` cache
 * entry.
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
 *   strict: true,
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
 * @public
 */
export function defineLive(
  config: DefineLiveOptions & {strict: true; perspective: LivePerspectiveResolver},
): {
  sanityFetch: DefinedFetchType
  sanityFetchMetadata: DefinedFetchMetadataType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
/**
 * Set up Sanity Live with `strict: true` and no `perspective` resolver.
 * Draft mode still drives `stega` and `includeDrafts`, and every fetch outside
 * draft mode is forced to `'published'`, but inside draft mode the perspective
 * has to come from the caller, so `perspective` is required on every
 * `sanityFetch` call. Use this when the app has no `[perspective]` route
 * segment and passes the perspective through props instead.
 *
 * @see [Live Content API](https://www.sanity.io/docs/content-lake/live-content-api)
 * @see [Sanity Live](https://www.sanity.io/live)
 *
 * @example
 * ```tsx
 * // sanity/live.ts
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
 *   strict: true,
 * })
 * ```
 *
 * @example
 * ```tsx
 * // app/[slug]/page.tsx
 * import {defineQuery} from 'next-sanity'
 * import {sanityFetch} from '@/sanity/live'
 *
 * const POST_QUERY = defineQuery(`
 *   *[_type == "post" && slug.current == $slug][0]
 * `)
 *
 * export default async function Page(props: PageProps<'/[slug]'>) {
 *   const {slug} = await props.params
 *   return <CachedPage slug={slug} />
 * }
 *
 * async function CachedPage({slug}: {slug: string}) {
 *   'use cache'
 *   // Outside draft mode this is a published fetch no matter what is passed.
 *   const {data} = await sanityFetch({query: POST_QUERY, params: {slug}, perspective: 'drafts'})
 *
 *   return <pre>{JSON.stringify(data, null, 2)}</pre>
 * }
 * ```
 *
 * @public
 */
export function defineLive(config: DefineLiveOptions & {strict: true; perspective?: undefined}): {
  sanityFetch: StrictDefinedFetchType
  sanityFetchMetadata: StrictDefinedFetchMetadataType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
/**
 * Set up Sanity Live. `defineLive` returns `sanityFetch`, `sanityFetchMetadata`,
 * and `<SanityLive />`, which connect your Sanity client to the Live Content API
 * so pages can serve cached content and update in response to fine-grained
 * content changes.
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
export function defineLive(config: DefineLiveOptions & {strict?: false; perspective?: undefined}): {
  sanityFetch: DefinedFetchType
  sanityFetchMetadata: DefinedFetchMetadataType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
export function defineLive(config: DefineLiveOptions) {
  const {
    client: _client,
    serverToken,
    browserToken,
    strict = false,
    perspective: resolvePerspective,
  } = config

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

  const sanityFetch: DefinedFetchType = async function sanityFetch({
    query,
    params = {},
    perspective: _perspective,
    variant: _variant,
    stega: _stega,
    tags: customCacheTags = [],
    requestTag = 'next-loader.fetch.cache-components',
  }) {
    const {perspective, variant, stega} = strict
      ? await resolveStrictFetchOptions(
          {perspective: _perspective, variant: _variant, stega: _stega},
          resolvePerspective,
        )
      : {perspective: _perspective, variant: _variant, stega: _stega}

    const useCdn = perspective ? perspective === 'published' : undefined
    const isBuildPhase = process.env['NEXT_PHASE'] === PHASE_PRODUCTION_BUILD
    const cacheMode = useCdn !== false && !isBuildPhase ? 'noStale' : undefined
    const token =
      ((perspective && perspective !== 'published') || stega) && serverToken
        ? serverToken
        : undefined

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
      (_includeDrafts ?? (strict ? (await draftMode()).isEnabled : false))
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

  const {projectId, dataset, apiVersion, apiHost, useProjectHostname} = client.config()
  const fetcherId = registerFetcher(
    [
      projectId,
      dataset,
      apiVersion,
      apiHost,
      useProjectHostname,
      serverToken ? fingerprint(serverToken) : 'no-token',
      strict ? 'strict' : 'loose',
      resolvePerspective ? `resolver:${resolvePerspective.name}` : 'no-resolver',
    ].join(':'),
    sanityFetch,
  )
  const sanityFetchMetadata: DefinedFetchMetadataType = async function sanityFetchMetadata({
    query,
    params = {},
    perspective,
    tags,
    requestTag,
  }) {
    return cachedMetadataFetch(fetcherId, query, await params, perspective, tags, requestTag)
  }

  return {sanityFetch, sanityFetchMetadata, SanityLive}
}
