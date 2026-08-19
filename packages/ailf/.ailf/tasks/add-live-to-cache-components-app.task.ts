import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-live-to-cache-components-app',
  title: 'Add Sanity Live to a Cache Components app using raw @sanity/client',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'apis-and-sdks/js-client-realtime',
        reason: 'Live Content API concepts underpinning defineLive',
      },
      {
        path: 'nextjs/caching-and-revalidation-in-nextjs',
        reason: 'Tag-based revalidation model the app currently hand-rolls',
      },
      {
        path: 'help/nextjs-16-sanitylive-status',
        reason: 'How next-sanity v13 integrates SanityLive with Cache Components',
      },
      {
        path: 'nextjs/configure-sanity-client-nextjs',
        reason: 'Sanity client configuration for Next.js',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-live-to-cache-components-app.reference.tsx',
  prompt: {
    text: `This Next.js 16 App Router site already runs with Cache Components (\`cacheComponents: true\`) and fetches Sanity content with plain @sanity/client calls inside \`'use cache'\` functions, tagged by hand. Content only refreshes when the one-hour cache window expires. Make published content update automatically when editors publish in Sanity Studio, keeping the pages cached.

This is the existing application:

\`\`\`ts
// next.config.ts
import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
\`\`\`

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

\`\`\`ts
// lib/data.ts
import {cacheLife, cacheTag} from 'next/cache'

import {client} from '@/lib/sanity'

export interface Post {
  _id: string
  title: string
  slug: {current: string}
}

export async function getPosts(): Promise<Post[]> {
  'use cache'
  cacheTag('sanity:posts')
  cacheLife({revalidate: 3600})
  return client.fetch(
    \`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, slug}\`,
  )
}
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

import {getPosts} from '@/lib/data'

export default async function IndexPage() {
  const posts = await getPosts()

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

Show all the files that need to change, and any new files.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'uses-define-live',
          text: '`defineLive` is imported from `next-sanity/live` and called with the Sanity client to obtain `sanityFetch` and `SanityLive`.',
        },
        {
          id: 'renders-sanity-live-in-layout',
          text: 'The `<SanityLive />` component is rendered once, inside the root layout body.',
        },
        {
          id: 'sanity-fetch-inside-use-cache',
          text: "Sanity data is fetched by calling `sanityFetch` inside a `'use cache'` boundary (for example a shared cached wrapper), replacing the direct `client.fetch` call.",
        },
        {
          id: 'drops-manual-tag-plumbing',
          text: "The hand-written `cacheTag('sanity:posts')` and short `cacheLife({revalidate: 3600})` plumbing is removed; `sanityFetch` registers fine-grained sync tags itself.",
        },
        {
          id: 'configures-sanity-cache-life',
          text: 'A long-lived cache profile suited to on-demand revalidation is configured, ideally the `sanity` profile from `next-sanity/live/cache-life` as the default `cacheLife` profile in `next.config.ts`.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'imports-from-next-sanity',
          text: 'Uses `next-sanity` (`defineLive` from `next-sanity/live`), not deprecated preview tooling or a hand-rolled EventSource/webhook revalidation pipeline.',
        },
        {
          id: 'keeps-cache-components-model',
          text: "Keeps the Cache Components model intact: pages stay cached via `'use cache'`; the solution does not opt routes out with `export const dynamic = 'force-dynamic'` or remove caching to get freshness.",
        },
        {
          id: 'no-dynamic-apis-inside-use-cache',
          text: "Does not call `draftMode()`, `cookies()`, or `headers()` inside `'use cache'` functions.",
        },
        {
          id: 'keeps-server-components',
          text: 'Pages remain async React Server Components; data fetching is not moved into Client Components.',
        },
      ],
    },
    {type: 'contains', value: 'defineLive'},
    {type: 'contains', value: 'SanityLive'},
    {type: 'contains', value: "'use cache'"},
  ],
})
