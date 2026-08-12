// Debug stega encoding bugs in a Next.js App Router app.
//
// Root cause: while draft mode is active (e.g. inside the Presentation Tool),
// `sanityFetch` returns strings with stega encoding — invisible characters
// that embed Content Source Map data (document, field, Studio URL). Rendered
// in JSX they are what makes click-to-edit overlays work, but used
// programmatically they corrupt logic:
//
// 1. `post.category === 'featured'` fails because the encoded string contains
//    extra invisible characters.
// 2. `hero hero--${post.layout}` produces a class name with invisible
//    characters that matches no stylesheet rule.
// 3. `generateMetadata` puts encoded strings into `<title>`/`<meta>`, which
//    search engines and social scrapers see as garbled text.
//
// The fix is targeted: clean individual values with `stegaClean` at the point
// of programmatic use, and fetch metadata with `stega: false`. Rendered text
// (`title`, `excerpt`) stays encoded so Visual Editing keeps working. Do not
// clean the whole query result and do not disable stega globally.

// --- app/posts/[slug]/page.tsx ---
import {defineQuery, stegaClean} from 'next-sanity'
import {notFound} from 'next/navigation'

import {sanityFetch} from '@/sanity/live'

const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{title, excerpt, category, layout}
`)

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata({params}: Props) {
  // `stega: false` keeps invisible characters out of <title> and <meta> tags.
  const {data: post} = await sanityFetch({
    query: POST_QUERY,
    params: await params,
    stega: false,
  })
  return {title: post?.title, description: post?.excerpt}
}

export default async function PostPage({params}: Props) {
  const {data: post} = await sanityFetch({query: POST_QUERY, params: await params})

  if (!post) notFound()

  // Clean values used in logic and attribute interpolation. `stegaClean`
  // strips the invisible encoding but leaves the visible string untouched.
  const isFeatured = stegaClean(post.category) === 'featured'
  const heroClass = `hero hero--${stegaClean(post.layout)}`

  return (
    <article className={isFeatured ? 'featured' : undefined}>
      <div className={heroClass}>
        {/* Rendered text keeps its stega encoding so click-to-edit works. */}
        <h1>{post.title}</h1>
      </div>
      <p>{post.excerpt}</p>
    </article>
  )
}

// --- Optional hardening (documentation only) ---
// During development, <VisualEditing onSuspiciousStega={...}> can audit the
// DOM for stega leaking into unsafe placements (attributes, <head>, URLs):
//
//   <VisualEditing
//     onSuspiciousStega={(reports) => {
//       for (const report of reports) console.warn(`Stega in ${report.kind}`, report)
//     }}
//   />
//
// For fields that are never rendered as visible text (identifiers, variant
// keys), the client's `stega.filter` option can exclude them from encoding at
// the source instead of cleaning at every call site.
