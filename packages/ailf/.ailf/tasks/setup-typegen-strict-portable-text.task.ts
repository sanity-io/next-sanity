import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'setup-typegen-strict-portable-text',
  title: 'Set up Sanity TypeGen with strict Portable Text inference',
  area: 'next-sanity',
  context: {
    docs: [
      {
        path: 'apis-and-sdks/sanity-typegen',
        reason: 'The Sanity TypeGen workflow: schema extract, typegen generate, defineQuery',
      },
      {
        path: 'help/configuring-typegen-in-sanity-cli-config',
        reason: 'TypeGen configuration in sanity.cli.ts',
      },
      {
        path: 'nextjs/query-content-nextjs',
        reason: 'Typed GROQ queries with defineQuery in Next.js',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/setup-typegen-strict-portable-text.reference.tsx',
  prompt: {
    text: `This Next.js App Router blog fetches Sanity content via next-sanity, but everything is typed by hand: queries are plain template strings and the results are cast to hand-written interfaces that have already drifted from the schema. The Portable Text renderer is untyped too, so nothing catches a missing handler when a new custom block type is added to the schema.

Set up Sanity TypeGen so query results are fully typed from the schema and queries, and type the Portable Text renderer strictly: TypeScript must require a component handler for every custom block type present in the content, and reject handlers for types that don't exist.

This is the existing code (the Sanity Studio lives in the same repository under \`studio/\`, and its schema includes a \`post\` document with a Portable Text \`body\` field that allows \`callout\` and \`codeBlock\` custom blocks):

\`\`\`ts
// sanity/queries.ts
export const postQuery = /* groq */ \`*[_type == "post" && slug.current == $slug][0]{title, body}\`
\`\`\`

\`\`\`tsx
// components/PostBody.tsx
import {PortableText} from '@portabletext/react'

interface PortableTextBlock {
  _type: string
  [key: string]: unknown
}

export function PostBody({value}: {value: PortableTextBlock[]}) {
  return (
    <PortableText
      value={value as never}
      components={{
        types: {
          callout: ({value}) => <aside>{String(value.text)}</aside>,
        },
      }}
    />
  )
}
\`\`\`

\`\`\`tsx
// app/posts/[slug]/page.tsx
import {notFound} from 'next/navigation'

import {PostBody} from '@/components/PostBody'
import {sanityFetch} from '@/sanity/live'
import {postQuery} from '@/sanity/queries'

interface Post {
  title: string
  body: unknown[]
}

export default async function PostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {data} = await sanityFetch({query: postQuery, params: {slug}})
  const post = data as Post | null

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <PostBody value={post.body as never} />
    </article>
  )
}
\`\`\`

Show the TypeGen setup (configuration and the commands or scripts to run) and all the files that need to change.`,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'typegen-workflow',
          text: 'Sets up the TypeGen workflow: `sanity schema extract` to produce `schema.json` and `sanity typegen generate` to produce `sanity.types.ts` (as scripts or documented commands).',
        },
        {
          id: 'typegen-configured',
          text: 'TypeGen is configured (a `typegen` block in `sanity.cli.ts`, or an equivalent config) so the query file paths, schema path, and generated output path are correct for this repository layout.',
        },
        {
          id: 'queries-use-define-query',
          text: 'Queries are rewritten as named variables using `defineQuery` (or the `groq` template tag) so TypeGen picks them up and the client infers result types automatically.',
        },
        {
          id: 'hand-written-types-removed',
          text: 'The hand-written `Post`/`PortableTextBlock` interfaces and `as` casts are removed in favor of generated types.',
        },
        {
          id: 'strict-portable-text-components',
          text: 'The Portable Text renderer is strictly typed: the value type is inferred from the generated query result (e.g. `InferValue`), and the `components` object is validated so handlers are required for the custom block types (`callout`, `codeBlock`) and unknown handlers are rejected (e.g. `satisfies InferStrictComponents<...>`).',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'uses-generated-inference',
          text: 'Relies on TypeGen client method overloading (`defineQuery` + generated `sanity.types.ts`) for fetch result types instead of manual generic parameters or `as` casts.',
        },
        {
          id: 'infer-types-from-query-results',
          text: 'Portable Text types are inferred from query result types, not from Sanity schema types, and use the `Infer*` utilities from `next-sanity` or `@portabletext/react` rather than hand-rolled types.',
        },
        {
          id: 'unique-named-queries',
          text: 'Each GROQ query is assigned to a uniquely named variable (TypeGen requires this; inline queries are not picked up).',
        },
      ],
    },
    {type: 'contains', value: 'defineQuery'},
    {type: 'contains', value: 'InferStrictComponents'},
    {type: 'contains-any', value: ['schema extract', 'typegen generate']},
  ],
})
