import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'setup-sync-tag-invalidate-function',
  title: 'Set up a Sync Tag Invalidate Function for guaranteed cache invalidation',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'functions/sync-tag-function-quickstart',
        reason:
          'Creating, testing, and deploying a Sync Tag Invalidate Function, and the done() contract behind waitFor',
      },
      {
        path: 'content-lake/live-content-api',
        reason:
          'Live Content API concepts: sync tags, and pairing an invalidate function with waitFor on SanityLive',
      },
      {
        path: 'blueprints/blueprint-config',
        reason: 'Blueprint function configuration: dataset scoping and environment variables',
      },
      {
        path: 'nextjs/caching-and-revalidation-in-nextjs',
        reason: 'The tag-based revalidation model behind the revalidation endpoint',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/setup-sync-tag-invalidate-function.reference.tsx',
  prompt: {
    text: `This Next.js App Router blog uses Sanity Live via next-sanity: visitors with the site open see published changes appear automatically. It deploys to Vercel with production at https://acme-blog.example.com, and the Sanity Studio lives in the same repository under \`studio/\` (project id \`xxxxxxxx\`, dataset \`production\`).

Editors report two freshness gaps. When they publish while nobody has the site open, no browser receives a live event, nothing invalidates the cache, and the next visitor still gets the old page until the cache expires on its own. And even visitors with an open tab are not guaranteed the new content: cached routes revalidate in the background, so a reload right after a publish can still serve the previous version.

Close both gaps with server-side invalidation: whenever published content changes, run code on Sanity's infrastructure that purges the affected cached content through an endpoint in this app, with no browser involved. Connected browsers should not react to a publish until that invalidation has completed, so an open tab never refreshes into a stale cache.

This is the existing application:

\`\`\`ts
// sanity/live.ts
import {createClient} from 'next-sanity'
import {defineLive} from 'next-sanity/live'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

export const {sanityFetch, SanityLive} = defineLive({client})
\`\`\`

\`\`\`tsx
// app/layout.tsx
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
\`\`\`

\`\`\`tsx
// app/page.tsx
import Link from 'next/link'
import {defineQuery} from 'next-sanity'

import {sanityFetch} from '@/sanity/live'

const POSTS_QUERY = defineQuery(\`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, slug}
\`)

export default async function IndexPage() {
  const {data: posts} = await sanityFetch({query: POSTS_QUERY})

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

Show all the files that need to change, and any new files, on both the Next.js and Sanity sides, including how the invalidation code gets deployed.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'sync-tag-invalidate-function',
          text: 'A Sanity Function built with `syncTagInvalidateEventHandler` from `@sanity/functions` reads the invalidated sync tags from `event.data.syncTags` and sends them to a revalidation endpoint in the Next.js app.',
        },
        {
          id: 'blueprint-registration',
          text: 'The function is registered as a sync-tag-invalidate resource via `defineSyncTagInvalidateFunction` from `@sanity/blueprints` in `sanity.blueprint.ts` (or the equivalent JSON blueprint), deployed with `sanity blueprints deploy`.',
        },
        {
          id: 'revalidate-endpoint',
          text: 'A route handler in the Next.js app (e.g. `app/api/revalidate-tags/route.ts`) parses the posted tags and expires them with `revalidateTag` from `next/cache`, adding the `sanity:` prefix that `sanityFetch` uses for its cache tags and expiring immediately (`{expire: 0}`) rather than stale-while-revalidate.',
        },
        {
          id: 'done-releases-events',
          text: 'The function notifies Sanity that invalidation is complete by calling the `done` callback with the sync tags only after calling the revalidation endpoint, since `done` is what releases the held-back live events to waiting browsers.',
        },
        {
          id: 'wait-for-function-prop',
          text: '`<SanityLive>` is given `waitFor="function"` so live events are delayed until the deployed function has processed them, meaning connected tabs only refresh after the cache has actually been invalidated.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'uses-sync-tag-function-apis',
          text: 'Uses the sync-tag-invalidate primitives (`syncTagInvalidateEventHandler`, `defineSyncTagInvalidateFunction`), not GROQ-powered webhooks, `parseBody` from `next-sanity/webhook`, or a document function that recomputes cache tags by hand.',
        },
        {
          id: 'endpoint-authenticated',
          text: 'The revalidation endpoint rejects unauthenticated requests using a server-side secret shared with the function (for example a bearer token compared timing-safely), validates that `tags` is an array of strings, and does not hardcode the secret.',
        },
        {
          id: 'wait-for-scoped-to-deployment',
          text: "The `waitFor` prop is only applied where the deployed function actually invalidates the cache, ideally `waitFor={process.env.VERCEL_ENV === 'production' ? 'function' : undefined}`, so local dev and previews keep immediate events and default revalidation.",
        },
        {
          id: 'keeps-live-integration',
          text: 'The existing live setup stays intact: `sanityFetch` still powers data fetching and `<SanityLive />` stays rendered; the function complements the live connection rather than being replaced by polling or reintroduced time-based revalidation (`export const revalidate`).',
        },
      ],
    },
    {type: 'contains', value: 'syncTagInvalidateEventHandler'},
    {
      type: 'contains-any',
      value: ['defineSyncTagInvalidateFunction', 'sanity.function.sync-tag-invalidate'],
    },
    {type: 'contains', value: 'waitFor'},
    {type: 'contains', value: 'revalidateTag'},
  ],
})
