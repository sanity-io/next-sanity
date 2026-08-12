// Set up Sanity TypeGen with strict Portable Text inference.
//
// TypeGen works in two steps: `sanity schema extract` writes a static
// `schema.json`, then `sanity typegen generate` overlays every `defineQuery`
// query on that schema and writes `sanity.types.ts`. With the default
// `overloadClientMethods: true`, fetch results are inferred automatically —
// no generics, no casts.
//
// Strict Portable Text inference comes from the generated query result types:
// `InferValue` extracts the Portable Text array type from a query result, and
// `satisfies InferStrictComponents<...>` makes TypeScript require a handler
// for every custom block type in that value (`callout`, `codeBlock`) and
// reject handlers for types that don't exist. Adding a new custom block to
// the schema becomes a compile error until the renderer handles it.

// --- studio/sanity.cli.ts ---
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'xxxxxxxx',
    dataset: 'production',
  },
  typegen: {
    // Scan the Next.js app for defineQuery/groq queries…
    path: '../{app,components,sanity}/**/*.{ts,tsx}',
    schema: './schema.json',
    // …and emit the generated types where the app can import them.
    generates: '../sanity.types.ts',
    // Default, shown for clarity: augments client fetch methods (and
    // sanityFetch) so query results are typed automatically.
    overloadClientMethods: true,
  },
})

// --- studio/package.json (scripts, documentation only) ---
// {
//   "scripts": {
//     "typegen": "sanity schema extract && sanity typegen generate"
//   }
// }
// Re-run `pnpm typegen` (or use the `--watch` flags) after schema or query
// changes. Ensure the generated `sanity.types.ts` is included by the app's
// tsconfig.json `include` patterns.

// --- sanity/queries.ts ---
import {defineQuery} from 'next-sanity'

// TypeGen requires queries assigned to uniquely named variables.
export const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{title, body}
`)

// --- components/PostBody.tsx ---
import {PortableText, type InferStrictComponents, type InferValue} from 'next-sanity'

import type {POST_QUERYResult} from '@/sanity.types'

// Infer the Portable Text array type from the generated query result type —
// not from schema types, since queries can reshape content. The next-sanity
// Infer* types are stega-aware, so both clean and draft-mode (stega-branded)
// results type-check.
type PostBodyValue = InferValue<NonNullable<POST_QUERYResult>['body']>

export function PostBody({value}: {value: PostBodyValue}) {
  const components = {
    types: {
      // TypeScript now requires handlers for every custom block type in the
      // value, and rejects handlers for unknown types.
      callout: ({value}) => <aside>{value.text}</aside>,
      codeBlock: ({value}) => (
        <pre>
          <code>{value.code}</code>
        </pre>
      ),
    },
  } satisfies InferStrictComponents<PostBodyValue>

  return <PortableText value={value} components={components} />
}

// --- app/posts/[slug]/page.tsx ---
import {notFound} from 'next/navigation'

import {PostBody} from '@/components/PostBody'
import {sanityFetch} from '@/sanity/live'
import {POST_QUERY} from '@/sanity/queries'

export default async function PostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  // `data` is typed as POST_QUERYResult automatically via defineQuery +
  // overloadClientMethods — no interfaces, no casts.
  const {data: post} = await sanityFetch({query: POST_QUERY, params: {slug}})

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      {Array.isArray(post.body) && <PostBody value={post.body} />}
    </article>
  )
}
