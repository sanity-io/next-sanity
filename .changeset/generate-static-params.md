---
"next-sanity": minor
---

Add `next-sanity/static-params` with `defineGenerateStaticParams`, `ensureStaticParams`, and `STATIC_PARAMS_PLACEHOLDER`.

Cache Components fails `next build` when `generateStaticParams` returns `[]`. A typo in the GROQ that lists your slugs used to surface as an opaque network error deep in the build. `defineGenerateStaticParams` takes the page's own query. It parses it with `groq-js` when the route module loads and reads the root `*[...]` filter. Each `<expression> == $param` conjunct becomes a route param, the other conjuncts stay as constraints, and the `[0]`, slices, `order()`, and projection are dropped. A syntax error, a `$param` that is not bound with `==`, or a query without bindings fails the build with the offending expression. At build time it fetches published documents, drops rows with `null` or mistyped values, and returns `[{slug: STATIC_PARAMS_PLACEHOLDER}]` instead of an empty array. `ensureStaticParams` is the fallback rule on its own for hand-written queries.

Before:

```ts
const postQuery = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title}`)

export async function generateStaticParams() {
  const {data} = await sanityFetchStaticParams({
    query: `*[_type == "post" && defined(slug.current)]{"slug": slug.current}`,
  })
  return data.length > 0 ? data : [{slug: "__placeholder__"}]
}

export default async function Page({params}: PageProps<"/posts/[slug]">) {
  const {slug} = await params
  if (slug === "__placeholder__") notFound()
  // ...
}
```

After:

```ts
import {defineGenerateStaticParams, STATIC_PARAMS_PLACEHOLDER} from "next-sanity/static-params"

const postQuery = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title}`)

export const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})

export default async function Page({params}: PageProps<"/posts/[slug]">) {
  const {slug} = await params
  if (slug === STATIC_PARAMS_PLACEHOLDER) notFound()
  // ...
}
```

Pass `order` and `limit` to prerender only the most recent documents. A nested segment such as `app/[category]/[slug]/page.tsx` receives the parent's params from Next.js, and a binding the parent already provides becomes a GROQ constraint instead of a generated param. A catch-all segment needs `fallback: {path: [STATIC_PARAMS_PLACEHOLDER]}`, because the query cannot tell `[slug]` from `[...slug]`. The result type defaults to `Record<string, string>[]` and takes a generic, `defineGenerateStaticParams<{slug: string}>(...)`, when you want it narrower.
