import type {resolvePerspectiveFromCookies as _resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
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
export function defineLive(_config: DefineLiveOptions): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
} {
  throw new Error('defineLive can only be used in React Server Components')
}

export type {
  DefinedFetchType as DefinedSanityFetchType,
  DefinedLiveProps as DefinedSanityLiveProps,
  DefineLiveOptions as DefineSanityLiveOptions,
  LivePerspective,
  SanityLiveContext,
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
} from '#live/types'

export {isCorsOriginError} from '#live/isCorsOriginError'

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
