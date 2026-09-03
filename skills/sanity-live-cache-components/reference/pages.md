# Page patterns

Every page lives under `app/[perspective]/`. The page itself never carries `'use cache'` and never reads draft mode. It renders a cached leaf inside `<Suspense>`, and the leaf calls `sanityFetch`.

## Contents

- [Structure](#structure)
- [Static page](#static-page)
- [Page with `params`](#page-with-params)
- [`searchParams` and other dynamic APIs](#searchparams-and-other-dynamic-apis)
- [Server actions](#server-actions)

## Structure

```text
Page (no 'use cache', no draftMode branch)
  └── <Suspense fallback={<PageFallback />}>
        <CachedPage slug={...} />   ('use cache', sanityFetch)
```

The published tree (`/published/...`) prerenders fully because `sanityFetch` only touches `draftMode()`, which Next.js allows inside a cache. In draft mode Next.js skips the cache, `sanityFetch` reads the `[perspective]` root param, and the leaf streams in through the same `<Suspense>` boundary. No branch is needed.

## Static page

```tsx
// src/app/[perspective]/page.tsx
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

const homeQuery = defineQuery(`*[_type == "home"][0]`)

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CachedPage />
    </Suspense>
  )
}

async function CachedPage() {
  'use cache'
  const {data} = await sanityFetch({query: homeQuery})
  return <article>{/* use `data` */}</article>
}
```

## Page with `params`

Do not await `params` in `Page`. Pass the promise down so the static shell is not blocked.

```tsx
// src/app/[perspective]/[slug]/page.tsx
import {client} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

const pageSlugsQuery = defineQuery(
  `*[_type == "page" && defined(slug.current)]{"slug": slug.current}`,
)
const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)

export async function generateStaticParams() {
  return client.fetch(pageSlugsQuery, {}, {perspective: 'published'})
}

export default function Page({params}: PageProps<'/[perspective]/[slug]'>) {
  return (
    <Suspense fallback={<PageFallback />}>
      {params.then(({slug}) => (
        <CachedPage slug={slug} />
      ))}
    </Suspense>
  )
}

async function CachedPage({slug}: {slug: string}) {
  'use cache'
  const {data} = await sanityFetch({query: pageQuery, params: {slug}})
  return <article>{/* use `data` */}</article>
}
```

Notes:

- `slug` is the only prop. `perspective` and `stega` are resolved by `sanityFetch`.
- `generateStaticParams` returns the child params only. The `[perspective]` layout's `generateStaticParams` supplies `published`.
- A good fallback skeleton that doesn't cause layout shift is highly recommended. In draft mode the leaf always streams.

## `searchParams` and other dynamic APIs

`searchParams`, `cookies()`, and `headers()` cannot be read inside `'use cache'`. Await them in a thin component inside `<Suspense>` and pass plain values to the cached leaf:

```tsx
// src/app/[perspective]/search/page.tsx
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

const searchQuery = defineQuery(`*[_type == "page" && title match $term]`)

export default function Page({searchParams}: PageProps<'/[perspective]/search'>) {
  return (
    <Suspense fallback={<PageFallback />}>
      {searchParams.then(({q}) => (
        <CachedResults term={String(q ?? '')} />
      ))}
    </Suspense>
  )
}

async function CachedResults({term}: {term: string}) {
  'use cache'
  const {data} = await sanityFetch({query: searchQuery, params: {term: `${term}*`}})
  return <ul>{/* use `data` */}</ul>
}
```

## Server actions

`'use server'` functions cannot carry `'use cache'` themselves. Call `cachedSanity` (see [live-helpers.md](live-helpers.md#cachedsanity)) so the fetch runs inside the shared boundary. Strict mode still reads draft mode inside it, so nothing is threaded in from the action's untrusted inputs:

```tsx
import {cachedSanity} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

const pagesQuery = defineQuery(`*[_type == "page"][0...$page]`)

export async function renderMore({page}: {page: number}) {
  'use server'
  const {data} = await cachedSanity({query: pagesQuery, params: {page}})
  return data
}
```
