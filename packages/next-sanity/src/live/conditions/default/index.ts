import type {resolvePerspectiveFromCookies as _resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import type {resolveVariantFromCookies as _resolveVariantFromCookies} from '#live/resolveVariantFromCookies'
import type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  LivePerspectiveResolver,
  StrictDefinedFetchType,
} from '#live/types'

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
  SanityLive: React.ComponentType<DefinedLiveProps>
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
export function defineLive(config: DefineLiveOptions & {strict?: false; perspective?: undefined}): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
export function defineLive(_config: DefineLiveOptions): never {
  throw new Error(`defineLive can't be imported by a client component`)
}

export type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  LivePerspective,
  LivePerspectiveResolver,
  SanityLiveAction,
  SanityLiveContext,
  SanityLiveOnError,
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
  SanityLiveOnWelcome,
  StrictDefinedFetchType,
} from '#live/types'

export {isCorsOriginError} from '#live/isCorsOriginError'
export {parseTags} from '#live/parseTags'

/**
 * This helper is intended for use with Next.js Cache Components (`cacheComponents: true`),
 * where `cookies()` and `draftMode()` cannot be called inside `'use cache'` boundaries.
 * Resolve the perspective once outside the cache boundary and pass it in as a prop / cache key.
 *
 * @example
 * ```tsx
 * import {cookies, draftMode} from 'next/headers'
 * import {defineQuery} from 'next-sanity'
 * import {resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
 * import {cachedSanity, cachedSanityStaticParams} from '#sanity/live'
 *
 * export async function generateStaticParams() {
 *   const query = defineQuery(`*[_type == "page" && defined(slug.current)]{"slug": slug.current}`)
 *   return await cachedSanityStaticParams({query})
 * }
 *
 * export default async function Page({params}: PageProps<'/[slug]'>) {
 *   const {isEnabled: isDraftMode} = await draftMode()
 *
 *   if (isDraftMode) {
 *     return (
 *       <Suspense>
 *         <DynamicPage params={params} />
 *       </Suspense>
 *     )
 *   }
 *
 *   const {slug} = await params
 *
 *   return <CachedPage slug={slug} perspective="published" stega={false} />
 * }
 *
 * async function DynamicPage({params}: Pick<PageProps<'/[slug]'>, 'params'>) {
 *   const {slug} = await params
 *   const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
 *
 *   return <CachedPage slug={slug} perspective={perspective} stega />
 * }
 *
 * async function CachedPage({
 *   slug,
 *   perspective,
 *   stega,
 * }: Awaited<PageProps<'/[slug]'>['params']> & {
 *   perspective: LivePerspective
 *   stega: boolean
 * }) {
 *   const query = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
 *   const {data} = await cachedSanity({query, params: {slug}, perspective, stega})
 *
 *   return <article>...</article>
 * }
 * ```
 *
 * @public
 */
export const resolvePerspectiveFromCookies: typeof _resolvePerspectiveFromCookies = () => {
  throw new Error(`resolvePerspectiveFromCookies can't be imported by a client component`)
}

/**
 * This helper is intended for use with Next.js Cache Components (`cacheComponents: true`),
 * where `cookies()` and `draftMode()` cannot be called inside `'use cache'` boundaries.
 * Resolve the variant once outside the cache boundary and pass it in as a prop / cache key.
 *
 * Unlike `resolvePerspectiveFromCookies` there is no fallback value: when no
 * variant cookie is set (or its value is invalid) it resolves to `undefined`,
 * meaning "no variant selected" and queries return base content.
 *
 * @example
 * ```tsx
 * import {cookies, draftMode} from 'next/headers'
 * import {defineQuery} from 'next-sanity'
 * import {
 *   resolvePerspectiveFromCookies,
 *   resolveVariantFromCookies,
 *   type LivePerspective,
 * } from 'next-sanity/live'
 * import {cachedSanity} from '#sanity/live'
 *
 * export default async function Page({params}: PageProps<'/[slug]'>) {
 *   const {isEnabled: isDraftMode} = await draftMode()
 *
 *   if (isDraftMode) {
 *     return (
 *       <Suspense>
 *         <DynamicPage params={params} />
 *       </Suspense>
 *     )
 *   }
 *
 *   const {slug} = await params
 *
 *   return <CachedPage slug={slug} perspective="published" stega={false} />
 * }
 *
 * async function DynamicPage({params}: Pick<PageProps<'/[slug]'>, 'params'>) {
 *   const {slug} = await params
 *   const jar = await cookies()
 *   const perspective = await resolvePerspectiveFromCookies({cookies: jar})
 *   const variant = await resolveVariantFromCookies({cookies: jar})
 *
 *   return <CachedPage slug={slug} perspective={perspective} variant={variant} stega />
 * }
 *
 * async function CachedPage({
 *   slug,
 *   perspective,
 *   variant,
 *   stega,
 * }: Awaited<PageProps<'/[slug]'>['params']> & {
 *   perspective: LivePerspective
 *   variant: string | undefined
 *   stega: boolean
 * }) {
 *   const query = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
 *   const {data} = await cachedSanity({query, params: {slug}, perspective, variant, stega})
 *
 *   return <article>...</article>
 * }
 * ```
 *
 * @public
 */
export const resolveVariantFromCookies: typeof _resolveVariantFromCookies = () => {
  throw new Error(`resolveVariantFromCookies can't be imported by a client component`)
}
