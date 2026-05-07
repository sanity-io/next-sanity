import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import type {cookies} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'
import type {LivePerspective} from '#live/types'

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
 * export async function getStaticParams() {
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
export async function resolvePerspectiveFromCookies({
  cookies: jar,
}: {
  cookies: Awaited<ReturnType<typeof cookies>>
}): Promise<LivePerspective> {
  return jar.has(perspectiveCookieName)
    ? sanitizePerspective(jar.get(perspectiveCookieName)?.value, 'drafts')
    : 'drafts'
}
