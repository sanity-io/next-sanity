# High-performance dynamic segments

[Dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) should always implement `generateStaticParams`, even if only a subset of pages. See [the Cache Components note on dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes#with-cache-components). Whether to use `loading.tsx` or `<Suspense>` for fallback UI depends on the use case. See [the streaming guide](https://nextjs.org/docs/app/guides/streaming#when-to-use-loadingjs-vs-suspense).

## Contents

- [Case 1: `page.tsx` with `loading.tsx` + partial `generateStaticParams`](#case-1-pagetsx-with-loadingtsx--partial-generatestaticparams)
- [Case 2: `layout.tsx` with non-blocking dynamic `params`](#case-2-layouttsx-with-non-blocking-dynamic-params)

## Case 1: `page.tsx` with `loading.tsx` + partial `generateStaticParams`

`generateStaticParams` returns only the 100 most recently updated pages. A sibling `loading.tsx` renders fallback UI, so `page.tsx` itself can skip the `<Suspense>` wrapper and await `params` directly.

`defineGenerateStaticParams` from `next-sanity/static-params` assembles the query from a GROQ filter and one GROQ expression per route param. It parses every piece with `groq-js` when the module loads, so a typo fails `next build` with the expression and its position. At build time it fetches from the published perspective and returns `[fallback]` instead of `[]`. Cache Components fails the build on an empty `generateStaticParams` result, so `fallback` is required and the page handles it with `notFound()`. The `fallback` shape types the result. A `string` value declares `[slug]` and a `string[]` value declares `[...slug]`.

This scales to thousands of pages without ballooning `next build` and without compromising UX in production:

- Prerendered pages load instantly.
- Pages not prerendered start rendering on `<Link>` hover (or when scrolled into view), so on click:
  - If prerendering finished in time, the page serves instantly with no loading state.
  - If not, the cached `loading.tsx` fallback shows instantly.

Add a sibling `src/app/[perspective]/[slug]/loading.tsx` that renders the same skeleton you would otherwise pass to `<Suspense>`. Keep it cheap and free of layout shift:

```tsx
// src/app/[perspective]/[slug]/loading.tsx
export default function Loading() {
  return (
    <article aria-busy>
      <p>Loading…</p>
    </article>
  )
}
```

```tsx
// src/app/[perspective]/[slug]/page.tsx
import {client} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {defineGenerateStaticParams} from 'next-sanity/static-params'
import {notFound} from 'next/navigation'

const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)

export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  filter: '_type == "page" && defined(slug.current)',
  params: {slug: 'slug.current'},
  fallback: {slug: '__placeholder__'},
  order: '_updatedAt desc',
  limit: 100,
})

// With a sibling `loading.tsx`, `Page` can await `params` directly.
// The `[perspective]` root param gets its value from the root layout's `generateStaticParams`.
export default async function Page({params}: PageProps<'/[perspective]/[slug]'>) {
  const {slug} = await params
  if (slug === '__placeholder__') notFound()
  return <CachedPage slug={slug} />
}

async function CachedPage({slug}: {slug: string}) {
  'use cache'
  const {data} = await sanityFetch({query: pageQuery, params: {slug}})
  return <article>{/* use `data` */}</article>
}
```

A nested segment such as `src/app/[category]/[slug]/page.tsx` receives the parent's params, and `defineGenerateStaticParams` forwards them to GROQ as variables:

```tsx
export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  filter: '_type == "page" && category->slug.current == $category',
  params: {slug: 'slug.current'},
  fallback: {slug: '__placeholder__'},
})
```

A root param with a constant value, such as `src/app/[perspective]/layout.tsx`, needs no helper. Return the constant, and Cache Components still gets its one required value:

```ts
export function generateStaticParams() {
  return [{perspective: 'published'}]
}
```

## Case 2: `layout.tsx` with non-blocking dynamic `params`

A `layout.tsx` can't use `loading.tsx` for fallback UI. [It's one level higher in the hierarchy](https://nextjs.org/docs/app/getting-started/project-structure#component-hierarchy). To fetch data that depends on dynamic `params` without blocking `children` from streaming, pass the unawaited `params` promise into a `<Suspense>` boundary and await it inside.

```tsx
// src/app/[perspective]/[slug]/layout.tsx
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

const footerQuery = defineQuery(`*[_type == "footer" && slug.current == $slug][0]`)

export default function SlugLayout({children, params}: LayoutProps<'/[perspective]/[slug]'>) {
  return (
    <>
      {children}
      {/* Below the fold, no fallback needed. `params` is awaited inside Suspense so `children` streams in parallel. */}
      <Suspense>
        {params.then(({slug}) => (
          <CachedFooter slug={slug} />
        ))}
      </Suspense>
    </>
  )
}

async function CachedFooter({slug}: {slug: string}) {
  'use cache'
  const {data} = await sanityFetch({query: footerQuery, params: {slug}})
  return <footer>{/* use `data` */}</footer>
}
```
