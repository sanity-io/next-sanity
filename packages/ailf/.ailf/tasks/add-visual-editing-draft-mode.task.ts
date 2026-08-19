import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-visual-editing-draft-mode',
  title: 'Add Visual Editing and Draft Mode to a Next.js app',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'visual-editing/visual-editing-with-next-js-app-router',
        reason: 'The canonical Next.js App Router visual editing integration guide',
      },
      {
        path: 'visual-editing/visual-editing-client-stega',
        reason: 'Client stega configuration and Content Source Maps',
      },
      {
        path: 'visual-editing/preview-and-page-building',
        reason: 'Presentation Tool concepts and configuration',
      },
      {
        path: 'visual-editing/introduction-to-visual-editing',
        reason: 'Visual editing overview and terminology',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-visual-editing-draft-mode.reference.tsx',
  prompt: {
    text: `This Next.js App Router blog fetches published Sanity content live via next-sanity. Editors now want to preview draft content on the real site and click any text in the preview to jump straight to the corresponding field in Sanity Studio (the Studio runs separately at http://localhost:3333 and its config can be changed too). Add draft mode and visual editing support.

This is the existing application:

\`\`\`ts
// sanity/client.ts
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})
\`\`\`

\`\`\`ts
// sanity/live.ts
import {defineLive} from 'next-sanity/live'

import {client} from '@/sanity/client'

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
// app/posts/[slug]/page.tsx
import {defineQuery} from 'next-sanity'
import {notFound} from 'next/navigation'

import {sanityFetch} from '@/sanity/live'

const POST_QUERY = defineQuery(\`
  *[_type == "post" && slug.current == $slug][0]{title, publishedAt}
\`)

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

\`\`\`ts
// studio/sanity.config.ts (separate Sanity Studio project)
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './src/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Blog Studio',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
\`\`\`

Show all the files that need to change, and any new files, on both the Next.js and Studio sides.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'draft-mode-enable-route',
          text: 'A draft mode enable route exists (e.g. `app/api/draft-mode/enable/route.ts`) built with `defineEnableDraftMode` from `next-sanity/draft-mode`, given a client configured with a server-side token.',
        },
        {
          id: 'visual-editing-component-gated',
          text: 'The `<VisualEditing />` component from `next-sanity/visual-editing` is rendered in the root layout, only when `draftMode()` is enabled.',
        },
        {
          id: 'stega-studio-url',
          text: 'The Sanity client is configured with `stega.studioUrl` pointing at the Studio, so overlays can resolve click-to-edit targets.',
        },
        {
          id: 'live-tokens-configured',
          text: '`defineLive` is given `serverToken` (and `browserToken`) from a server-only environment variable so draft content can be fetched and live-previewed.',
        },
        {
          id: 'presentation-tool-configured',
          text: "The Studio config adds `presentationTool` with a `previewUrl` whose `previewMode.enable` path matches the frontend's draft mode enable route (and an `origin` for a separately hosted frontend).",
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'current-import-paths',
          text: 'Uses the current next-sanity v13 import paths: `defineEnableDraftMode` from `next-sanity/draft-mode`, `VisualEditing` from `next-sanity/visual-editing`, `defineLive` from `next-sanity/live`.',
        },
        {
          id: 'no-deprecated-packages',
          text: 'Does not use deprecated approaches: `@sanity/preview-kit`, `next-sanity/preview`, hand-rolled `/api/preview` secret-checking routes, or `LiveQueryProvider`.',
        },
        {
          id: 'token-stays-server-side',
          text: 'The read token is read from a server-only environment variable (not `NEXT_PUBLIC_`), and is not hardcoded.',
        },
        {
          id: 'draft-mode-exit-path',
          text: 'Provides a way to leave draft mode (a disable route and/or a `DisableDraftMode` UI affordance).',
        },
      ],
    },
    {type: 'contains', value: 'defineEnableDraftMode'},
    {type: 'contains', value: 'VisualEditing'},
    {type: 'contains', value: 'presentationTool'},
    {type: 'not-contains', value: '@sanity/preview-kit'},
  ],
})
