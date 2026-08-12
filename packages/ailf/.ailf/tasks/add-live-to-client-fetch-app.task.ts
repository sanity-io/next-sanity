import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-live-to-client-fetch-app',
  title: 'Add Sanity Live to a Next.js app fetching with @sanity/client',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'nextjs/query-content-nextjs',
        reason: 'Fetching Sanity content in Next.js with next-sanity and defineQuery',
      },
      {
        path: 'nextjs/configure-sanity-client-nextjs',
        reason: 'Sanity client configuration for Next.js, including live and token layers',
      },
      {
        path: 'nextjs/caching-and-revalidation-in-nextjs',
        reason: 'Caching strategies this task should move away from in favor of live content',
      },
      {
        path: 'apis-and-sdks/js-client-realtime',
        reason: 'Live Content API concepts underpinning defineLive',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-live-to-client-fetch-app.reference.tsx',
  prompt: {
    text: `Editors publish posts in Sanity Studio, but this Next.js App Router blog only shows the changes after the 60 second revalidation window expires. Make published content update live, so visitors see new content without reloading and without shortening the revalidation window.

This is the existing application:

\`\`\`ts
// lib/sanity.ts
import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})
\`\`\`

\`\`\`tsx
// app/layout.tsx
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
\`\`\`

\`\`\`tsx
// app/page.tsx
import Link from 'next/link'

import {client} from '@/lib/sanity'

export const revalidate = 60

interface Post {
  _id: string
  title: string
  slug: {current: string}
}

export default async function IndexPage() {
  const posts = await client.fetch<Post[]>(
    \`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, slug}\`,
  )

  return (
    <main>
      <h1>Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <Link href={\`/posts/\${post.slug.current}\`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
\`\`\`

\`\`\`tsx
// app/posts/[slug]/page.tsx
import {notFound} from 'next/navigation'

import {client} from '@/lib/sanity'

export const revalidate = 60

interface Post {
  title: string
  publishedAt: string
}

export default async function PostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const post = await client.fetch<Post | null>(
    \`*[_type == "post" && slug.current == $slug][0]{title, publishedAt}\`,
    {slug},
  )

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.publishedAt}</p>
    </article>
  )
}
\`\`\`

Show all the files that need to change, and any new files.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'uses-define-live',
          text: '`defineLive` is imported from `next-sanity/live` and called with the configured Sanity client to obtain `sanityFetch` and `SanityLive`.',
        },
        {
          id: 'renders-sanity-live-in-layout',
          text: 'The `<SanityLive />` component is rendered once, inside the root layout body.',
        },
        {
          id: 'fetches-with-sanity-fetch',
          text: 'Page data fetching goes through `sanityFetch` (reading `data` from its result) instead of calling `client.fetch` directly in components.',
        },
        {
          id: 'removes-time-based-revalidation',
          text: 'The `export const revalidate = 60` route segment configs are removed rather than kept alongside live content.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'imports-from-next-sanity',
          text: 'Uses the `next-sanity` package (e.g. `createClient` from `next-sanity` and `defineLive` from `next-sanity/live`), not deprecated preview tooling such as `@sanity/preview-kit`.',
        },
        {
          id: 'no-hand-rolled-polling',
          text: 'Does not hand-roll live updates with `useEffect` polling, `setInterval`, manual EventSource subscriptions, or `router.refresh()` timers.',
        },
        {
          id: 'keeps-server-components',
          text: 'Pages remain async React Server Components; data fetching is not moved into Client Components.',
        },
        {
          id: 'sensible-token-handling',
          text: 'If tokens are configured, the server token comes from a server-only environment variable (e.g. `SANITY_API_READ_TOKEN`), not a `NEXT_PUBLIC_` variable, or token config is omitted for published-only content.',
        },
      ],
    },
    {type: 'contains', value: 'defineLive'},
    {type: 'contains', value: 'SanityLive'},
    {type: 'not-contains', value: '@sanity/preview-kit'},
  ],
})
