import type {resolvePerspectiveFromCookies as _resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import type {resolveVariantFromCookies as _resolveVariantFromCookies} from '#live/resolveVariantFromCookies'
import type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
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
 *   resolveVariantFromCookies,
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
 *   variant?: string
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
 *   const variant = await resolveVariantFromCookies({cookies: jar})
 *   return {perspective: perspective ?? 'drafts', variant, stega: true}
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
 *   const {perspective, variant, stega} = await getDynamicFetchOptions()
 *
 *   return <CachedPage slug={slug} perspective={perspective} variant={variant} stega={stega} />
 * }
 *
 * async function CachedPage({
 *   slug,
 *   perspective,
 *   variant,
 *   stega,
 * }: {slug: string} & DynamicFetchOptions) {
 *   'use cache'
 *
 *   const {data} = await sanityFetch({
 *     query: POST_QUERY,
 *     params: {slug},
 *     perspective,
 *     variant,
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
export function defineLive(_config: DefineLiveOptions): never {
  throw new Error(`defineLive can't be imported by a client component`)
}

export type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  LivePerspective,
  SanityLiveAction,
  SanityLiveContext,
  SanityLiveOnError,
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
  SanityLiveOnWelcome,
  StrictDefinedFetchType,
  StrictDefinedLiveProps,
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
 * import {sanityFetch, sanityFetchStaticParams} from '#sanity/live'
 *
 * export async function generateStaticParams() {
 *   const query = defineQuery(`*[_type == "page" && defined(slug.current)]{"slug": slug.current}`)
 *   return await sanityFetchStaticParams({query})
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
 *   'use cache'
 *
 *   const query = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
 *   const {data} = await sanityFetch({query, params: {slug}, perspective, stega})
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
 * import {sanityFetch} from '#sanity/live'
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
 *   'use cache'
 *
 *   const query = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
 *   const {data} = await sanityFetch({query, params: {slug}, perspective, variant, stega})
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
