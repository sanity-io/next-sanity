# High-performance dynamic segments

[Dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) should always implement `generateStaticParams`, even if only a subset of pages — see [the Cache Components note on dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes#with-cache-components). Whether to use `loading.tsx` or `<Suspense>` for fallback UI depends on the use case — see [the streaming guide](https://nextjs.org/docs/app/guides/streaming#when-to-use-loadingjs-vs-suspense).

## Contents

- [Case 1: `page.tsx` with `loading.tsx` + partial `generateStaticParams`](#case-1-pagetsx-with-loadingtsx--partial-generatestaticparams)
- [Case 2: `layout.tsx` with non-blocking dynamic `params`](#case-2-layouttsx-with-non-blocking-dynamic-params)

## Case 1: `page.tsx` with `loading.tsx` + partial `generateStaticParams`

`generateStaticParams` returns only the 100 most recently updated pages. A sibling `loading.tsx` renders fallback UI, so `page.tsx` itself can skip the `<Suspense>` wrapper. The same fallback UI is reused in draft mode.

`defineGenerateStaticParams` from `next-sanity/static-params` assembles the query from a GROQ filter and one GROQ expression per route param, parses every piece with `groq-js` when the module loads (a typo fails `next build` with the expression and position), fetches from the published perspective, and returns `[fallback]` instead of `[]`. Cache Components fails the build on an empty `generateStaticParams` result, so `fallback` is required and the page handles it with `notFound()`. The `fallback` shape types the result: a `string` value declares `[slug]`, a `string[]` value declares `[...slug]`.

This scales to thousands of pages without ballooning `next build` and without compromising UX in production:

- Prerendered pages load instantly.
- Pages not prerendered start rendering on `<Link>` hover (or when scrolled into view), so on click:
  - If prerendering finished in time → serves instantly, no loading state.
  - If not → instantly shows the cached `loading.tsx` fallback.

Add a sibling `src/app/[slug]/loading.tsx` that renders the same skeleton you would otherwise pass to `<Suspense>`. Keep it cheap and free of layout shift:

```tsx
// src/app/[slug]/loading.tsx
export default function Loading() {
  return (
    <article aria-busy>
      <p>Loading…</p>
    </article>
  )
}
```

```tsx
// src/app/[slug]/page.tsx
import {cachedSanity, getDynamicFetchOptions, type DynamicFetchOptions} from '@/sanity/lib/live'
import {client} from '@/sanity/lib/client'
import {defineQuery} from 'next-sanity'
import {defineGenerateStaticParams} from 'next-sanity/static-params'
import {notFound} from 'next/navigation'

export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  filter: '_type == "page" && defined(slug.current)',
  params: {slug: 'slug.current'},
  fallback: {slug: '__placeholder__'},
  order: '_updatedAt desc',
  limit: 100,
})

// With sibling `loading.tsx`, skip the `<Suspense>` + `DynamicPage` indirection: await `params`
// and `getDynamicFetchOptions` directly inside `Page`.
export default async function Page({params}: PageProps<'/[slug]'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  if (slug === '__placeholder__') notFound()
  return <CachedPage slug={slug} perspective={perspective} stega={stega} />
}
async function CachedPage({
  slug,
  perspective,
  stega,
}: Awaited<PageProps<'/[slug]'>['params']> & DynamicFetchOptions) {
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await cachedSanity({
    query: pageQuery,
    params: {slug},
    perspective,
    stega,
  })
  return <article>{/* use `data` to render stuff */}</article>
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

A `layout.tsx` can't use `loading.tsx` for fallback UI — [it's one level higher in the hierarchy](https://nextjs.org/docs/app/getting-started/project-structure#component-hierarchy). To fetch data that depends on dynamic `params` without blocking `children` from streaming, pass the unawaited `params` promise into a `<Suspense>` boundary and await it inside.

```tsx
// src/app/(website)/[slug]/layout.tsx

import {cachedSanity, getDynamicFetchOptions, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

export default function WebsiteLayout({children, params}: LayoutProps<'/[slug]'>) {
  return (
    <>
      {children}
      {/* The footer renders below the fold, no fallback needed */}
      <Suspense>
        <DynamicFooter
          // Don't await `params` here — pass the promise and await inside Suspense so `children` streams in parallel
          params={params}
        />
      </Suspense>
    </>
  )
}
async function DynamicFooter({params}: Pick<LayoutProps<'/[slug]'>, 'params'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  return <Footer slug={slug} perspective={perspective} stega={stega} />
}
async function Footer({
  slug,
  perspective,
  stega,
}: Awaited<LayoutProps<'/[slug]'>['params']> & DynamicFetchOptions) {
  const footerQuery = defineQuery(`*[_type == "footer" && slug.current == $slug][0]`)
  const {data} = await cachedSanity({query: footerQuery, params: {slug}, perspective, stega})
  return <footer>{/* use `data` to render stuff */}</footer>
}
```
