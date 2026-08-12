// Migrate a Sanity Live app to Cache Components (`cacheComponents: true`)
// with full feature parity.
//
// The key differences from the pre-Cache-Components setup:
// - `next.config.ts` enables `cacheComponents` and registers the `sanity`
//   cacheLife profile as the default, since Sanity Live revalidates on demand
//   and the default 15 minute profile is too short.
// - With Cache Components, `sanityFetch` calls `cacheTag`/`cacheLife`
//   internally but does not create the `'use cache'` boundary. The app
//   provides one shared boundary (`cachedSanity`) so callers don't add their
//   own.
// - Dynamic request APIs (`draftMode()`, `cookies()`) must not be called
//   inside `'use cache'`. `strict: true` makes `perspective` and `stega`
//   required fetch options, and `getDynamicFetchOptions()` resolves them
//   outside the cache boundary. The draft-mode render path is wrapped in
//   `<Suspense>` so the published path stays prerenderable.

// --- next.config.ts ---
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {default: sanity},
}

export default nextConfig

// --- sanity/live.ts ---
import {cookies, draftMode} from 'next/headers'
import {createClient} from 'next-sanity'
import {
  defineLive,
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
  type LivePerspective,
  type StrictDefinedFetchType,
} from 'next-sanity/live'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
  perspective: 'published',
})

const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
})

// The app's one shared 'use cache' boundary. `sanityFetch` calls
// `cacheTag`/`cacheLife` internally but doesn't create the boundary —
// this wrapper provides it once, so callers don't add their own.
export const cachedSanity: StrictDefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}

export interface DynamicFetchOptions {
  perspective: LivePerspective
  variant?: string
  // `boolean` brands `sanityFetch` `data`; use literal `false` for clean types
  stega: boolean
}

// Resolve dynamic values outside 'use cache' boundaries.
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return {perspective: 'published', stega: false}
  }

  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({cookies: jar})
  const variant = await resolveVariantFromCookies({cookies: jar})
  return {perspective: perspective ?? 'drafts', variant, stega: true}
}

// --- app/layout.tsx ---
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {SanityLive} from '@/sanity/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}

// --- app/posts/[slug]/page.tsx ---
import {draftMode} from 'next/headers'
import {defineQuery} from 'next-sanity'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'

import {cachedSanity, getDynamicFetchOptions, type DynamicFetchOptions} from '@/sanity/live'

const POSTS_SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]{"slug": slug.current}
`)
const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{title, publishedAt}
`)

export async function generateStaticParams() {
  const {data} = await cachedSanity({
    query: POSTS_SLUGS_QUERY,
    perspective: 'published',
    stega: false,
  })

  return data
}

export default async function PostPage({params}: {params: Promise<{slug: string}>}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense fallback={<div>Loading…</div>}>
        <DynamicPostPage params={params} />
      </Suspense>
    )
  }

  const {slug} = await params
  return <CachedPostPage slug={slug} perspective="published" stega={false} />
}

async function DynamicPostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {perspective, variant, stega} = await getDynamicFetchOptions()

  return <CachedPostPage slug={slug} perspective={perspective} variant={variant} stega={stega} />
}

async function CachedPostPage({
  slug,
  perspective,
  variant,
  stega,
}: {slug: string} & DynamicFetchOptions) {
  const {data: post} = await cachedSanity({
    query: POST_QUERY,
    params: {slug},
    perspective,
    variant,
    stega,
  })

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.publishedAt}</p>
    </article>
  )
}
