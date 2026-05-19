---
name: sanity-live-cache-components
description: Migrate next-sanity apps to cacheComponents - strict mode, three-layer component pattern, explicit perspective/stega/includeDrafts, prop-drilling conventions
---

# Sanity Live + Cache Components

Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. If the guide conflicts with this skill, follow this skill.

## Prerequisites

- `next@16.2.x` or later
- `AGENTS.md` set up ([guide](https://nextjs.org/docs/app/guides/ai-agents#existing-projects))
- Environment variables: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`

---

## 1. Install `next-sanity@^13`

If `next-sanity@latest` isn't v13 yet, use `next-sanity@cache-components`. Check with `npm dist-tag ls next-sanity`.

```bash
npm install next-sanity@^13 --save-exact
```

---

## 2. `next.config.ts`

```ts
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {default: sanity},
}

export default nextConfig
```

---

## 3. `client.ts` and `live.ts`

### `client.ts`

If the file exists, append missing options only. NEVER change `apiVersion` or remove existing `stega.*` options.

```ts
// src/sanity/lib/client.ts
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true,
  apiVersion: '2026-05-19',
  perspective: 'published',
  stega: {studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'},
})
```

### `live.ts`

If the file exists, add missing exports only.

```ts
// src/sanity/lib/live.ts
import {type QueryParams} from 'next-sanity'
import {defineLive, resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import {client} from './client'

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}

export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
})

export interface DynamicFetchOptions {
  perspective: LivePerspective
  stega: boolean
}
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return {perspective: 'published', stega: false}
  }

  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({cookies: jar})
  return {perspective: perspective ?? 'drafts', stega: true}
}

// For usage within `generateStaticParams`
export async function sanityFetchStaticParams<const QueryString extends string>({
  query,
  params = {},
}: {
  query: QueryString
  params?: QueryParams
}) {
  'use cache'
  const {data} = await sanityFetch({query, params, perspective: 'published', stega: false})
  return {data}
}

// For usage within `generateMetadata` and `generateViewport`
export async function sanityFetchMetadata<const QueryString extends string>({
  query,
  params = {},
  perspective,
}: {
  query: QueryString
  params?: QueryParams
  perspective: LivePerspective
}) {
  'use cache'
  const {data} = await sanityFetch({query, params, perspective, stega: false})
  return {data}
}
```

---

## 4. `<SanityLive>` in root layout

Place in a `layout.tsx` (never `page.tsx`). Render at most once. Same for `<VisualEditing>`.

```tsx
// src/app/layout.tsx
import {SanityLive} from '@/sanity/lib/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

export default async function RootLayout({children}: LayoutProps<'/'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

If an embedded Sanity Studio exists (e.g. `app/studio/[[...index]]/page.tsx`), move `<SanityLive>` into a route group layout (e.g. `src/app/(website)/layout.tsx`) that excludes the studio route.

---

## 5. Critical Rules

### Rule 1: NEVER hardcode `perspective` or `stega` in `sanityFetch` calls

Pass them as props from a dynamic boundary. Hardcoding breaks Visual Editing and content release previews.

### Rule 2: `sanityFetch` MUST be inside a `'use cache'` boundary

The calling function must have `'use cache'` or `'use cache: remote'`.

### Rule 3: `getDynamicFetchOptions()` MUST be outside `'use cache'`

It calls `cookies()` (dynamic API). Resolve it in a Dynamic layer, pass results as props to a Cached layer.

### Rule 4: In server actions, resolve `perspective`/`stega` inside the `'use server'` boundary

NEVER accept them as function arguments (untrusted client input). Call `getDynamicFetchOptions()` in the server action, pass to a `'use cache'` helper.

### Rule 5: `sanityFetchStaticParams` only in `generateStaticParams`

Never use `sanityFetch` in `generateStaticParams`. Never use `sanityFetchStaticParams` outside it.

### Rule 6: `sanityFetchMetadata` for metadata functions

Use in `generateMetadata`, `generateViewport`, `generateSitemaps`, `generateImageMetadata`, and metadata files (`icon.tsx`, `opengraph-image.tsx`, etc.). Always resolve `perspective` via `getDynamicFetchOptions()`. No `'use cache'` needed at callsite (already built-in).

### Rule 7: In `route.ts`, hardcode `stega: false` but resolve `perspective`

Route handlers don't render in DOM with `<VisualEditing>`, so stega is pointless/harmful.

---

## 6. Three-Layer Component Pattern

Core architecture for every route.

```
Layer 1: Page/Layout
  ├── NOT draft mode → <CachedX perspective="published" stega={false} />
  └── draft mode → <Suspense fallback={...}>
                      Layer 2: <DynamicX params={params} />
                        └── Layer 3: <CachedX ...awaited props... />
```

### Complete example: `[slug]/page.tsx`

```tsx
// src/app/[slug]/page.tsx
import {
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {draftMode} from 'next/headers'
import {Suspense} from 'react'

export async function generateStaticParams() {
  const pageSlugsQuery = defineQuery(
    `*[_type == "page" && defined(slug.current)]{"slug": slug.current}`,
  )
  const {data} = await sanityFetchStaticParams({query: pageSlugsQuery})
  return data
}

// Layer 1: branches on draftMode, NO 'use cache' here (calls draftMode())
export default async function Page({params}: PageProps<'/[slug]'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense fallback={<PageFallback />}>
        <DynamicPage params={params} />
      </Suspense>
    )
  }
  const {slug} = await params
  return <CachedPage slug={slug} perspective="published" stega={false} />
}

// Layer 2: awaits dynamic APIs, passes serializable props down
async function DynamicPage({params}: Pick<PageProps<'/[slug]'>, 'params'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  return <CachedPage slug={slug} perspective={perspective} stega={stega} />
}

// Layer 3: 'use cache', only serializable props
async function CachedPage({
  slug,
  perspective,
  stega,
}: Awaited<PageProps<'/[slug]'>['params']> & DynamicFetchOptions) {
  'use cache'
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetch({query: pageQuery, params: {slug}, perspective, stega})
  return <article>{/* render data */}</article>
}
```

### When to use `searchParams` or skip `generateStaticParams`

Always render `<Suspense>` unconditionally (no `draftMode` branch). Make `Page` synchronous:

```tsx
export default function Page({params}: PageProps<'/[slug]'>) {
  return (
    <Suspense fallback={<PageFallback />}>
      <DynamicPage params={params} />
    </Suspense>
  )
}
```

### `generateMetadata` example

```ts
import {getDynamicFetchOptions, sanityFetchMetadata} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

export async function generateMetadata({params}: PageProps<'/[slug]'>) {
  const [{slug}, {perspective}] = await Promise.all([params, getDynamicFetchOptions()])
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetchMetadata({query: pageQuery, params: {slug}, perspective})
}
```

### Server action example

```tsx
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function fetchMore({page, perspective, stega}: {page: string} & DynamicFetchOptions) {
  'use cache'
  const pagesQuery = defineQuery(`*[_type == "page"][0...$page]`)
  const {data} = await sanityFetch({query: pagesQuery, params: {page}, perspective, stega})
  return data
}
async function renderMore({page}: {page: string}) {
  'use server'
  const {perspective, stega} = await getDynamicFetchOptions()
  const data = await fetchMore({page, perspective, stega})
}
```

---

## 7. Layout data fetching

### Rules for `layout.tsx`

- Top-level layout MUST NOT `await` dynamic APIs or fetch data directly
- Push data fetching into child components wrapped in `<Suspense>`
- Extract shared queries into reusable `'use cache'` functions

### Example

```tsx
// src/app/(website)/layout.tsx
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {draftMode} from 'next/headers'
import {Suspense} from 'react'

async function fetchSettings({perspective, stega}: DynamicFetchOptions) {
  'use cache'
  const settingsQuery = defineQuery(`*[_type == "settings"][0]`)
  const {data} = await sanityFetch({query: settingsQuery, perspective, stega})
  return data
}

export default async function WebsiteLayout({children}: LayoutProps<'/'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <>
      {isDraftMode ? (
        <Suspense fallback={<NavbarFallback />}>
          <DynamicNavbar />
        </Suspense>
      ) : (
        <CachedNavbar perspective="published" stega={false} />
      )}
      {children}
      {isDraftMode ? (
        <Suspense>
          <DynamicFooter />
        </Suspense>
      ) : (
        <CachedFooter perspective="published" stega={false} />
      )}
    </>
  )
}

async function DynamicNavbar() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedNavbar perspective={perspective} stega={stega} />
}
async function CachedNavbar({perspective, stega}: DynamicFetchOptions) {
  'use cache'
  const data = await fetchSettings({perspective, stega})
  return <Navbar data={data} />
}

async function DynamicFooter() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedFooter perspective={perspective} stega={stega} />
}
async function CachedFooter({perspective, stega}: DynamicFetchOptions) {
  'use cache'
  const data = await fetchSettings({perspective, stega})
  return <Footer data={data} />
}
```

---

## 8. Dynamic Segments with `loading.tsx`

When a sibling `loading.tsx` exists, the three-layer pattern simplifies to two layers (no `<Suspense>` or `DynamicX` needed):

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
  const {data} = await sanityFetch({query: pageQuery, params: {slug}, perspective, stega})
  return <article>{/* render data */}</article>
}
```

### Layout with dynamic `params` (non-blocking)

```tsx
// src/app/(website)/[slug]/layout.tsx
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

export default function WebsiteLayout({children, params}: LayoutProps<'/[slug]'>) {
  return (
    <>
      {children}
      <Suspense>
        <DynamicFooter params={params} />
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
  return <footer>{/* render data */}</footer>
}
```
