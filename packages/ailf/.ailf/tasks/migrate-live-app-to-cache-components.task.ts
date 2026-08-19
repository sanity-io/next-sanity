import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'migrate-live-app-to-cache-components',
  title: 'Migrate a Sanity Live app to Cache Components with feature parity',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'help/nextjs-16-sanitylive-status',
        reason:
          'Next.js 16 + SanityLive behavior and how next-sanity v13 integrates with Cache Components',
      },
      {
        path: 'nextjs/caching-and-revalidation-in-nextjs',
        reason: 'Next.js caching model the app is migrating from',
      },
      {
        path: 'nextjs/configure-sanity-client-nextjs',
        reason: 'Client configuration layers, including live and draft-mode concerns',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/migrate-live-app-to-cache-components.reference.tsx',
  prompt: {
    text: `This Next.js 16 App Router blog already uses Sanity Live via next-sanity: published visitors get cached pages that update when content is published, and editors preview drafts through draft mode. Migrate it to Cache Components (\`cacheComponents: true\` in next.config.ts) with full feature parity: the published experience must stay cached and keep updating live, and draft mode must keep working.

This is the existing application:

\`\`\`ts
// next.config.ts
import type {NextConfig} from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
\`\`\`

\`\`\`ts
// sanity/live.ts
import {createClient} from 'next-sanity'
import {defineLive} from 'next-sanity/live'

const client = createClient({
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
})
\`\`\`

\`\`\`tsx
// app/layout.tsx
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {SanityLive} from '@/sanity/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
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
\`\`\`

\`\`\`tsx
// app/posts/[slug]/page.tsx
import {defineQuery} from 'next-sanity'
import {notFound} from 'next/navigation'

import {sanityFetch} from '@/sanity/live'

const POSTS_SLUGS_QUERY = defineQuery(\`
  *[_type == "post" && defined(slug.current)]{"slug": slug.current}
\`)
const POST_QUERY = defineQuery(\`
  *[_type == "post" && slug.current == $slug][0]{title, publishedAt}
\`)

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: POSTS_SLUGS_QUERY,
    perspective: 'published',
    stega: false,
  })

  return data
}

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
\`\`\`

Show all the files that need to change, and any new files.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'enables-cache-components',
          text: '`next.config.ts` sets `cacheComponents: true`.',
        },
        {
          id: 'configures-sanity-cache-life',
          text: "A long-lived cache profile suited to Sanity Live's on-demand revalidation is configured, ideally the `sanity` profile from `next-sanity/live/cache-life` set as the default `cacheLife` profile in `next.config.ts`.",
        },
        {
          id: 'provides-use-cache-boundary',
          text: "`sanityFetch` calls happen inside a `'use cache'` boundary (for example one shared cached wrapper function around `sanityFetch`), since with Cache Components `sanityFetch` tags the cache but does not create the boundary itself.",
        },
        {
          id: 'draft-mode-parity',
          text: 'Draft mode still works: dynamic values from `draftMode()` (and cookies) are resolved outside the cached code path and passed in, with the draft-mode render path wrapped in `<Suspense>` so the published path stays prerenderable.',
        },
        {
          id: 'live-updates-preserved',
          text: '`<SanityLive />` stays rendered so published pages keep revalidating in response to content changes.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'no-dynamic-apis-inside-use-cache',
          text: "Does not call `draftMode()`, `cookies()`, or `headers()` inside `'use cache'` functions or components.",
        },
        {
          id: 'explicit-fetch-options',
          text: 'Cached fetches pass explicit `perspective` and `stega` options (for example via `strict: true` on `defineLive`) instead of relying on request-time auto-detection inside the cache boundary.',
        },
        {
          id: 'no-manual-cache-tag-plumbing',
          text: 'Does not hand-roll per-callsite `cacheTag`/`revalidateTag` plumbing for Sanity data; `sanityFetch` handles sync-tag registration internally.',
        },
        {
          id: 'no-stale-workarounds',
          text: 'Does not reintroduce `export const revalidate`, `export const dynamic`, or webhook-based revalidation as a substitute for the live integration.',
        },
      ],
    },
    {type: 'contains', value: 'cacheComponents'},
    {type: 'contains', value: "'use cache'"},
    {type: 'contains-any', value: ['cache-life', 'cacheLife']},
  ],
})
