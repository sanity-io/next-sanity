---
"next-sanity": minor
---

Add `next-sanity/static-params` with `defineGenerateStaticParams` and `ensureStaticParams`.

Cache Components fails `next build` when `generateStaticParams` returns `[]`, and a typo in the GROQ that lists your slugs used to surface as an opaque network error deep in the build. `defineGenerateStaticParams` takes a GROQ filter and one GROQ expression per route param. It parses every piece with `groq-js` when the route module loads, so the build fails on the offending expression and its position. At build time it fetches published documents, drops rows with `null` or mistyped values, and returns `[fallback]` instead of an empty array. `ensureStaticParams` is the fallback rule on its own for hand-written queries.

Before:

```ts
export async function generateStaticParams() {
  const {data} = await sanityFetchStaticParams({
    query: `*[_type == "post" && defined(slug.current)]{"slug": slug.current}`,
  })
  return data.length > 0 ? data : [{slug: "__placeholder__"}]
}
```

After:

```ts
import {defineGenerateStaticParams} from "next-sanity/static-params"

export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  filter: '_type == "post" && defined(slug.current)',
  params: {slug: "slug.current"},
  fallback: {slug: "__placeholder__"},
  order: "_updatedAt desc",
  limit: 100,
})
```

The `fallback` shape types the result: a `string` value declares a `[slug]` segment and a `string[]` value declares a `[...slug]` segment. Nested segments receive the parent params as GROQ variables, so `app/[category]/[slug]/page.tsx` can filter on `$category`. Handle the placeholder in the page with `notFound()`.
