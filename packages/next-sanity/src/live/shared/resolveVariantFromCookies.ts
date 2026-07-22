import {variantCookieName} from '@sanity/preview-url-secret/constants'
import type {cookies} from 'next/headers'

import {sanitizeVariant} from '#live/sanitizeVariant'

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
export async function resolveVariantFromCookies({
  cookies: jar,
}: {
  cookies: Awaited<ReturnType<typeof cookies>>
}): Promise<string | undefined> {
  return jar.has(variantCookieName) ? sanitizeVariant(jar.get(variantCookieName)?.value) : undefined
}
