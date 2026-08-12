// Add Sanity Live to a Next.js App Router app that previously used plain
// @sanity/client calls with time-based revalidation.
//
// `defineLive` connects the app to the Live Content API: `sanityFetch` keeps
// fetches cacheable and tags them with sync tags, and `<SanityLive />` listens
// for content changes and revalidates the affected pages, so time-based
// `revalidate` exports are no longer needed.

// --- lib/sanity.ts ---
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

// --- sanity/live.ts ---
import {defineLive} from 'next-sanity/live'

import {client} from '@/lib/sanity'

// Server-only token so live fetches can resolve draft content when needed.
// For published-only content both tokens can be omitted (set them to `false`
// to silence the development warnings).
const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

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
import {defineQuery} from 'next-sanity'
import Link from 'next/link'

import {sanityFetch} from '@/sanity/live'

const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, slug}
`)

export default async function IndexPage() {
  const {data: posts} = await sanityFetch({query: POSTS_QUERY})

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

// --- app/posts/[slug]/page.tsx ---
import {defineQuery} from 'next-sanity'
import {notFound} from 'next/navigation'

import {sanityFetch} from '@/sanity/live'

const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{title, publishedAt}
`)

export default async function PostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {data: post} = await sanityFetch({query: POST_QUERY, params: {slug}})

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.publishedAt}</p>
    </article>
  )
}

// --- .env.local (documentation only) ---
// NEXT_PUBLIC_SANITY_PROJECT_ID="<project-id>"
// NEXT_PUBLIC_SANITY_DATASET="production"
// SANITY_API_READ_TOKEN="<viewer-token>"
