import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'debug-stega-encoding-bugs',
  title: 'Debug stega encoding bugs in a Next.js app',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'visual-editing/troubleshooting-visual-editing',
        reason: 'Troubleshooting guide covering stega-related failure modes',
      },
      {
        path: 'visual-editing/visual-editing-client-stega',
        reason: 'How stega encoding works and how to configure it',
      },
      {
        path: 'visual-editing/visual-editing-architecture',
        reason: 'Where stega fits in the visual editing architecture',
      },
      {
        path: 'visual-editing/visual-editing-with-next-js-app-router',
        reason: 'Next.js-specific stega guidance (stegaClean, metadata fetches)',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/debug-stega-encoding-bugs.reference.tsx',
  prompt: {
    text: `This Next.js App Router blog uses next-sanity with Sanity Live and Visual Editing. Everything works in production, but when editors preview the site through the Presentation Tool, three bugs appear:

1. Featured posts lose their highlight: the \`post.category === 'featured'\` check stops matching.
2. The hero section renders with broken styles: the CSS class computed from the CMS \`layout\` field doesn't match any stylesheet rule.
3. Browser tabs and social shares show garbled, gibberish-looking page titles.

Diagnose the root cause and fix the code properly. Click-to-edit overlays in the preview must keep working for the visible text (titles, excerpts).

This is the relevant code:

\`\`\`tsx
// app/posts/[slug]/page.tsx
import {defineQuery} from 'next-sanity'
import {notFound} from 'next/navigation'

import {sanityFetch} from '@/sanity/live'

const POST_QUERY = defineQuery(\`
  *[_type == "post" && slug.current == $slug][0]{title, excerpt, category, layout}
\`)

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata({params}: Props) {
  const {data: post} = await sanityFetch({query: POST_QUERY, params: await params})
  return {title: post?.title, description: post?.excerpt}
}

export default async function PostPage({params}: Props) {
  const {data: post} = await sanityFetch({query: POST_QUERY, params: await params})

  if (!post) notFound()

  const isFeatured = post.category === 'featured'
  const heroClass = \`hero hero--\${post.layout}\`

  return (
    <article className={isFeatured ? 'featured' : undefined}>
      <div className={heroClass}>
        <h1>{post.title}</h1>
      </div>
      <p>{post.excerpt}</p>
    </article>
  )
}
\`\`\`

Explain what is going on, then show the corrected code.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'identifies-stega-root-cause',
          text: 'Identifies the root cause: in draft mode, string values are stega-encoded with invisible characters (Content Source Map data), which breaks equality checks and string interpolation into class names, and leaks into metadata.',
        },
        {
          id: 'cleans-comparison-values',
          text: 'Fixes the `category` comparison and the `layout` class interpolation by cleaning the values with `stegaClean` before using them programmatically.',
        },
        {
          id: 'fixes-metadata-fetch',
          text: 'Fixes the garbled titles by passing `stega: false` to the `sanityFetch` call in `generateMetadata` (or equivalently cleaning the returned strings).',
        },
        {
          id: 'preserves-rendered-stega',
          text: 'Keeps stega intact for rendered text (`title`, `excerpt` in the JSX) so click-to-edit overlays keep working; does not clean the whole query result.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'uses-stega-clean',
          text: 'Uses `stegaClean` imported from `next-sanity` (or `@sanity/client/stega`), not regex hacks or manual character stripping.',
        },
        {
          id: 'does-not-disable-stega-globally',
          text: 'Does not fix the bugs by disabling stega for the whole app or removing visual editing, which would break click-to-edit.',
        },
        {
          id: 'targeted-cleaning',
          text: 'Cleans values at the point of programmatic use (comparisons, class names, metadata) rather than wrapping every fetch result in `stegaClean`.',
        },
      ],
    },
    // No hard `stega: false` guard: the metadata fix is judged by the
    // `fixes-metadata-fetch` rubric criterion, which also accepts cleaning the
    // returned strings instead of disabling stega for the fetch.
    {type: 'contains', value: 'stegaClean'},
  ],
})
