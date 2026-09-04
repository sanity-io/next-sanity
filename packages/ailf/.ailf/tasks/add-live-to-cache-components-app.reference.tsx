// Add Sanity Live to an app that already runs Cache Components and fetched
// Sanity content with plain @sanity/client calls inside hand-tagged
// `'use cache'` functions.
//
// `defineLive` replaces the manual `cacheTag`/`cacheLife` plumbing:
// `sanityFetch` registers fine-grained sync tags for exactly the content each
// query depends on, and `<SanityLive />` revalidates those tags when content
// is published. The app keeps one shared `'use cache'` boundary — with Cache
// Components, `sanityFetch` tags the cache but does not create the boundary
// itself.

// --- next.config.ts ---
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Sanity Live revalidates on demand, so the default 15 minute profile is
  // too short. The `sanity` profile keeps cached content until a publish.
  cacheLife: {default: sanity},
}

export default nextConfig

// --- lib/sanity.ts ---
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

// --- sanity/live.ts ---
import {defineLive, type DefinedFetchType} from 'next-sanity/live'

import {client} from '@/lib/sanity'

const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

// The app's one shared 'use cache' boundary. `sanityFetch` calls
// `cacheTag`/`cacheLife` internally but doesn't create the boundary —
// this wrapper provides it once, so callers don't add their own.
export const cachedSanity: DefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}

// --- lib/data.ts ---
import {defineQuery} from 'next-sanity'

import {cachedSanity} from '@/sanity/live'

const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, slug}
`)

export async function getPosts() {
  const {data} = await cachedSanity({query: POSTS_QUERY})
  return data
}

// --- app/layout.tsx ---
import {SanityLive} from '@/sanity/live'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}

// --- app/page.tsx ---
// Unchanged apart from the now-typed `getPosts` result.
import Link from 'next/link'

import {getPosts} from '@/lib/data'

export default async function IndexPage() {
  const posts = await getPosts()

  return (
    <main>
      <h1>Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <Link href={`/posts/${post.slug.current}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
