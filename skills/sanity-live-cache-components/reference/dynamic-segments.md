# High-performance dynamic segments

[Dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) should always implement `generateStaticParams`, even if only a subset of pages — see [the Cache Components note on dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes#with-cache-components). Whether to use `loading.tsx` or `<Suspense>` for fallback UI depends on the use case — see [the streaming guide](https://nextjs.org/docs/app/guides/streaming#when-to-use-loadingjs-vs-suspense).

## Contents

- [Case 1: `page.tsx` with `loading.tsx` + partial `generateStaticParams`](#case-1-pagetsx-with-loadingtsx--partial-generatestaticparams)
- [Case 2: `layout.tsx` with non-blocking dynamic `params`](#case-2-layouttsx-with-non-blocking-dynamic-params)

## Case 1: `page.tsx` with `loading.tsx` + partial `generateStaticParams`

`generateStaticParams` returns only the 100 most recently updated pages. A sibling `loading.tsx` renders fallback UI, so `page.tsx` itself can skip the `<Suspense>` wrapper. The same fallback UI is reused in draft mode.

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
import {
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

export async function generateStaticParams() {
  const pageSlugsQuery = defineQuery(
    `*[_type == "page" && defined(slug.current)] | order(_updatedAt desc) [0...100]{"slug": slug.current}`,
  )
  const {data} = await sanityFetchStaticParams({query: pageSlugsQuery})
  return data
}

// With sibling `loading.tsx`, skip the `<Suspense>` + `DynamicPage` indirection: await `params`
// and `getDynamicFetchOptions` directly inside `Page`.
export default async function Page({params}: PageProps<'/[slug]'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  return <CachedPage slug={slug} perspective={perspective} stega={stega} />
}
async function CachedPage({
  slug,
  perspective,
  stega,
}: Awaited<PageProps<'/[slug]'>['params']> & DynamicFetchOptions) {
  'use cache'
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetch({
    query: pageQuery,
    params: {slug},
    perspective,
    stega,
  })
  return <article>{/* use `data` to render stuff */}</article>
}
```

## Case 2: `layout.tsx` with non-blocking dynamic `params`

A `layout.tsx` can't use `loading.tsx` for fallback UI — [it's one level higher in the hierarchy](https://nextjs.org/docs/app/getting-started/project-structure#component-hierarchy). To fetch data that depends on dynamic `params` without blocking `children` from streaming, pass the unawaited `params` promise into a `<Suspense>` boundary and await it inside.

```tsx
// src/app/(website)/[slug]/layout.tsx

import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
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
  'use cache'
  const footerQuery = defineQuery(`*[_type == "footer" && slug.current == $slug][0]`)
  const {data} = await sanityFetch({query: footerQuery, params: {slug}, perspective, stega})
  return <footer>{/* use `data` to render stuff */}</footer>
}
```
