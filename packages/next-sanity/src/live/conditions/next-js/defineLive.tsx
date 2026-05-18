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
export function defineLive(_config: DefineLiveOptions): never {
  throw new Error(
    'defineLive does not yet support `cacheComponents: true`. Wait for the next major version of next-sanity, or use the prerelease with `pnpm install next-sanity@cache-components`',
  )
}
