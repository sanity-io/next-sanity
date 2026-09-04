# Non-blocking layout patterns

When Sanity content is fetched inside a `layout.tsx`, the goal is to keep `children` streaming and keep the static shell as large as possible.

## Contents

- [Rules](#rules)
- [Pattern: cached components per section](#pattern-cached-components-per-section)
- [Anti-pattern: wrapping `children` in a single cached layout](#anti-pattern-wrapping-children-in-a-single-cached-layout)

## Rules

- The top-level `layout.tsx` component must not `await` dynamic APIs (other than `draftMode()`) or fetch data. Anything else (`cookies()`, `headers()`, `await params`, data fetching) reduces the static shell or slows draft-mode streaming.
- Push [dynamic API calls](https://nextjs.org/docs/app/guides/streaming#push-dynamic-access-down) down to the leaf that needs them.
- Two components fetching the same query don't need a shared helper to avoid duplicate requests. `sanityFetch` inside `'use cache'` keys the cache on the fetch options, so identical calls resolve from one cache entry.
- No `draftMode()` branch. The cached leaf reads it through `sanityFetch`.

## Pattern: cached components per section

```tsx
// src/app/[perspective]/layout.tsx
import {SanityLive, sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

const settingsQuery = defineQuery(`*[_type == "settings"][0]`)

export function generateStaticParams() {
  return [{perspective: 'published'}]
}

export default function RootLayout({children}: LayoutProps<'/[perspective]'>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<NavbarFallback />}>
          <CachedNavbar />
        </Suspense>
        {children}
        <Suspense>
          <CachedFooter />
        </Suspense>
        <SanityLive />
      </body>
    </html>
  )
}

async function CachedNavbar() {
  'use cache'
  // Same query as CachedFooter, so one cache entry and one request.
  const {data} = await sanityFetch({query: settingsQuery})
  return <Navbar data={data} />
}

async function CachedFooter() {
  'use cache'
  const {data} = await sanityFetch({query: settingsQuery})
  return <Footer data={data} />
}
```

Both sections are part of the prerendered `/published` shell. In draft mode the layout still renders immediately while each section streams in.

## Anti-pattern: wrapping `children` in a single cached layout

This blocks `children` on the layout's data fetch and prevents the page itself from streaming in independently.

```tsx
// src/app/[perspective]/layout.tsx
export default function RootLayout({children}: LayoutProps<'/[perspective]'>) {
  return (
    <Suspense>
      <CachedWebsiteLayout>{children}</CachedWebsiteLayout>
    </Suspense>
  )
}

async function CachedWebsiteLayout({children}: {children: React.ReactNode}) {
  'use cache'
  const {data} = await sanityFetch({query: settingsQuery})
  return (
    <>
      <Navbar data={data} />
      {children}
      <Footer data={data} />
    </>
  )
}
```
