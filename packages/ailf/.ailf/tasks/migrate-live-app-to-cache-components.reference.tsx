// Migrate a Sanity Live app to Cache Components (`cacheComponents: true`)
// with full feature parity.
//
// What changes against the pre-Cache-Components setup:
// - `next.config.ts` enables `cacheComponents` and registers the `sanity`
//   cacheLife profile as the default, since Sanity Live revalidates on demand
//   and the default 15 minute profile is too short.
// - With Cache Components, `sanityFetch` calls `cacheTag`/`cacheLife`
//   internally but does not create the `'use cache'` boundary. Each leaf that
//   fetches carries the directive itself.
// - `sanityFetch` reads `draftMode()` inside the cache, which Next.js allows.
//   Outside draft mode it fetches `published` without stega, inside draft mode
//   it fetches drafts with stega and Next.js skips the cache. Nothing is
//   resolved outside the boundary and threaded through props, and
//   `<SanityLive />` derives `includeDrafts` from draft mode on its own.
// - `generateStaticParams` runs at build time with no request and no draft
//   mode, so it uses the plain client with `perspective: 'published'`.
// - Every route moves under `app/[perspective]/`. `proxy.ts` rewrites `/x` to
//   `/<perspective>/x` from the draft mode cookies, and `defineLive` receives
//   the `perspective` root param getter so Presentation Tool release previews
//   keep working. This segment is optional. Without it `defineLive` takes no
//   resolver, the routes stay where they are, and the draft-mode perspective
//   is `'drafts'`.

// --- next.config.ts ---
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {default: sanity},
}

export default nextConfig

// --- proxy.ts ---
import {definePerspectiveProxy} from 'next-sanity/live/proxy'

export const proxy = definePerspectiveProxy()

// Next.js needs the matcher as a literal in this file.
export const config = {
  matcher: [
    '/((?!_next|_vercel|api|studio|favicon|\\.well-known|robots\\.|sitemap\\.|[^/]*\\.).*)?',
  ],
}

// --- sanity/live.ts ---
import {createClient} from 'next-sanity'
import {defineLive} from 'next-sanity/live'
import {perspective} from 'next/root-params'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  perspective,
})

// --- app/[perspective]/layout.tsx ---
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {SanityLive} from '@/sanity/live'

export function generateStaticParams() {
  return [{perspective: 'published'}]
}

export default async function RootLayout({children}: LayoutProps<'/[perspective]'>) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}

// --- app/[perspective]/posts/[slug]/page.tsx ---
import {defineQuery} from 'next-sanity'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'

import {client, sanityFetch} from '@/sanity/live'

const POSTS_SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]{"slug": slug.current}
`)
const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{title, publishedAt}
`)

export async function generateStaticParams() {
  return client.fetch(POSTS_SLUGS_QUERY, {}, {perspective: 'published'})
}

export default function PostPage({params}: PageProps<'/[perspective]/posts/[slug]'>) {
  return (
    <Suspense fallback={<article aria-busy>Loading…</article>}>
      {params.then(({slug}) => (
        <CachedPost slug={slug} />
      ))}
    </Suspense>
  )
}

async function CachedPost({slug}: {slug: string}) {
  'use cache'
  const {data: post} = await sanityFetch({query: POST_QUERY, params: {slug}})

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.publishedAt}</p>
    </article>
  )
}
