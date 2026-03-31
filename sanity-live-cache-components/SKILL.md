---
name: sanity-live-cache-components
description: Migrate next-sanity apps to cacheComponents - strict mode, three-layer component pattern, explicit perspective/stega/includeDrafts, prop-drilling conventions
---

# Sanity Live + Cache Components (`next-sanity@cache-components`)

Use `next-sanity@cache-components` with Next.js 16+ `cacheComponents: true` to get Partial Prerendering with Sanity Live. This replaces the automatic `draftMode()` behavior with explicit `perspective`, `stega`, and `includeDrafts` passing.

> **Canary release** -- not yet stable, may have breaking changes in minor/patch releases.

---

## 1. Install

```bash
npm install next-sanity@cache-components --save-exact
```

Requires `next@16+`.

---

## 2. Configure `next.config.ts`

```ts
// next.config.ts
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {sanity},
}

export default nextConfig
```

### When is `cacheLife('sanity')` needed?

`sanityFetch` calls `cacheLife` internally -- `'use cache'` boundaries that call `sanityFetch` do **not** need `cacheLife('sanity')`.

The `sanity` preset is only needed for `'use cache'` boundaries that do **not** call `sanityFetch` but should match Sanity's revalidation timing (e.g. a cached layout shell). Without it, those boundaries default to revalidating every 15 minutes, which is unnecessary since Sanity Live handles on-demand revalidation.

If the app has no such boundaries, the `cacheLife: {sanity}` config can be omitted entirely.

---

## 3. Configure `defineLive`

### `strict: true` (when using Visual Editing)

Set `strict: true` when the app uses **Visual Editing** in Sanity Studio's Presentation Tool -- especially for **perspective switching with Content Releases**. This ensures the app correctly handles different perspectives by making `perspective`, `stega`, and `includeDrafts` required at every call site (type-enforced).

**How to detect**: if the app renders `<VisualEditing />` from `next-sanity/visual-editing` anywhere (typically in the root layout), it uses Visual Editing and should set `strict: true`.

If the app does not use Visual Editing, `strict` can be omitted -- the defaults (`perspective: 'published'`, `stega: false`, `includeDrafts: false`) are sufficient.

```ts
// src/sanity/lib/live.ts

import {createClient, type QueryParams} from 'next-sanity'
import {defineLive, resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true,
  apiVersion: 'v2025-03-04',
  stega: {studioUrl: '/studio'},
})

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
})
```

When `strict: true`:

- `sanityFetch()` **requires** explicit `perspective` and `stega`
- `<SanityLive>` **requires** explicit `includeDrafts` prop
- Missing values produce **type errors** and **runtime errors**

---

## 4. `getDynamicFetchOptions` Helper

Export this from the same `live.ts` file. It encapsulates the `draftMode()` and `cookies()` calls that cannot be used inside `'use cache'` boundaries:

```ts
// src/sanity/lib/live.ts (continued)

export interface DynamicFetchOptions {
  perspective: LivePerspective
  stega: boolean
  isDraftMode: boolean
}

export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return {perspective: 'published', stega: false, isDraftMode}
  }

  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({cookies: jar})
  return {perspective: perspective ?? 'drafts', stega: true, isDraftMode}
}
```

**Call this at the top level only** -- in `layout.tsx` or `page.tsx`. Never call it deep in the component tree (see [Prop-Drilling](#6-prop-drilling)).

---

## 5. `sanityFetchStaticParams` Helper

Export a helper for `generateStaticParams` to avoid repeating boilerplate:

```ts
// src/sanity/lib/live.ts (continued)

export async function sanityFetchStaticParams<const QueryString extends string>({
  query,
  params = {},
}: {
  query: QueryString
  params?: QueryParams
}) {
  return client.fetch(query, params, {perspective: 'published', stega: false, useCdn: true})
}
```

Usage:

```ts
export async function generateStaticParams() {
  return sanityFetchStaticParams({query: slugsByTypeQuery, params: {type: 'page'}})
}
```

---

## 6. Prop-Drilling

**Resolve `isDraftMode`, `perspective`, and `stega` once at the top level and prop-drill them down.** This is critical:

1. `getDynamicFetchOptions()` calls `draftMode()` -- a dynamic API. Calling it deep in the tree **shrinks the static shell** and may cause unexpected Suspense fallbacks.
2. In draft mode, `getDynamicFetchOptions()` calls `cookies()` -- the calling component **must** be wrapped in `<Suspense>`. This complexity belongs at the top level, not in every `<Navbar>` or `<Footer>`.

The three-layer pattern (Page -> Dynamic -> Cached) should **only exist in `layout.tsx` and `page.tsx`**. Shared components receive resolved values as props and go straight to their cached layer.

---

## 7. The Three-Layer Component Pattern

This is the core architecture for every route.

### Structure

```
Page/Layout (Layer 1)
  ├── NOT draft mode → <CachedX perspective="published" stega={false} />  (no Suspense)
  └── draft mode → <Suspense fallback={...}>
                      <DynamicX params={params} />  (Layer 2)
                        └── <CachedX slug={slug} perspective={p} stega={s} />  (Layer 3)
```

### Layer 1: Page Component

Calls `draftMode()` and branches:

```tsx
export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense
        fallback={
          <Template>
            <LoadingSkeleton />
          </Template>
        }
      >
        <DynamicPage params={params} />
      </Suspense>
    )
  }
  const {slug} = await params
  return <CachedPage slug={slug} perspective="published" stega={false} />
}
```

- **Not in draft mode**: await `params`, render cached directly -- no Suspense, maximizes static shell
- **In draft mode**: pass the `params` Promise to `<DynamicX>` **without awaiting** -- let it resolve inside the Suspense boundary so the static shell streams immediately

### Layer 2: Dynamic Component

Only rendered in the draft mode path. Resolves all async values:

```tsx
async function DynamicPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedPage slug={slug} perspective={perspective} stega={stega} />
}
```

### Layer 3: Cached Component

Has `'use cache'` and only receives plain, serializable props:

```tsx
async function CachedPage({
  slug,
  perspective,
  stega,
}: {slug: string} & Pick<DynamicFetchOptions, 'perspective' | 'stega'>) {
  'use cache'
  const {data} = await sanityFetch({
    query: PAGE_QUERY,
    params: {slug},
    perspective,
    stega,
  })

  return (
    <Template>
      <h1>{data?.title}</h1>
    </Template>
  )
}
```

### Rules

- **Never** call `draftMode()`, `cookies()`, or `headers()` inside `'use cache'`
- **Never** wrap cached components in `<Suspense>` outside draft mode -- unnecessary streaming boundaries shrink the static shell
- **Always** pass plain values (`slug: string`) to cached components, not Promises
- **Always** pass explicit `perspective="published"` and `stega={false}` in the non-draft path -- never omit these or make them optional. Every call to a cached component or `sanityFetch` must have explicit values so cache keys are consistent and stable in production. A mixture of `undefined` and `"published"` would create duplicate cache entries for the same content.
- `perspective` and `stega` act as **cache keys** -- published and draft content get separate cache entries automatically

---

## 8. `<SanityLive>` -- Pass `includeDrafts`

With `cacheComponents: true`, `<SanityLive>` defaults `includeDrafts` to `false` and does **not** read `draftMode()` internally. You must pass it explicitly:

```tsx
<SanityLive includeDrafts={isDraftMode} />
```

---

## 9. Layout Example

The root layout resolves `draftMode()` once and wraps individual dynamic components in their own Suspense boundaries -- no `<DynamicLayout>` wrapper needed:

```tsx
// src/app/(site)/layout.tsx

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {getDynamicFetchOptions, SanityLive} from '@/sanity/lib/live'
import {Navbar} from '@/components/Navbar'
import {Footer} from '@/components/Footer'
import {Suspense} from 'react'

export default async function SiteLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return <CachedLayout isDraftMode={isDraftMode}>{children}</CachedLayout>
}

function CachedLayout({children, isDraftMode}: {children: React.ReactNode; isDraftMode: boolean}) {
  return (
    <div className="flex min-h-screen flex-col">
      {isDraftMode ? (
        <Suspense fallback={<Navbar perspective="published" stega={false} />}>
          <DynamicNavbar />
        </Suspense>
      ) : (
        <Navbar perspective="published" stega={false} />
      )}

      <main>{children}</main>

      {isDraftMode ? (
        <Suspense fallback={<Footer perspective="published" stega={false} />}>
          <DynamicFooter />
        </Suspense>
      ) : (
        <Footer perspective="published" stega={false} />
      )}

      <SanityLive includeDrafts={isDraftMode} />
      {isDraftMode && <VisualEditing />}
    </div>
  )
}

async function DynamicNavbar() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <Navbar perspective={perspective} stega={stega} />
}

async function DynamicFooter() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <Footer perspective={perspective} stega={stega} />
}
```

Key points:

- `draftMode()` is called once in `SiteLayout` and the result is passed to `<CachedLayout>` -- calling `draftMode()` in a layout does **not** prevent the layout from being included in the static shell. The `<CachedLayout>` component ensures the shell HTML is still prerendered.
- Each dynamic component (`<Navbar>`, `<Footer>`) gets its own `<Suspense>` boundary with the published cached version as fallback -- users see cached content while draft content streams in
- `<DynamicNavbar>` and `<DynamicFooter>` are thin wrappers defined inline that call `getDynamicFetchOptions()` and pass the result as props
- The static shell (`<div>`, `<main>`, etc.) is never wrapped in Suspense

---

## 10. Shared Component Example (Navbar)

With prop-drilling, shared components become simple -- no `draftMode()`, no `getDynamicFetchOptions()`, no internal Suspense. The layout handles all of that. The component just receives props and renders cached:

```tsx
// src/components/Navbar.tsx

import {sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {settingsQuery} from '@/sanity/lib/queries'

export async function Navbar({
  perspective,
  stega,
}: Pick<DynamicFetchOptions, 'perspective' | 'stega'>) {
  'use cache'
  const {data} = await sanityFetch({query: settingsQuery, perspective, stega})
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 bg-white/80 px-4 py-4 backdrop-blur">
      {data?.menuItems?.map((item) => (
        <a key={item._key} href={item.slug}>
          {item.title}
        </a>
      ))}
    </header>
  )
}
```

The layout wraps `<Navbar>` in `<Suspense>` when in draft mode (see [Layout Example](#9-layout-example)). The Navbar itself doesn't know or care about draft mode.

---

## 11. Page Example (Dynamic Route)

```tsx
// src/app/(site)/[slug]/page.tsx

import {draftMode} from 'next/headers'
import {defineQuery} from 'next-sanity'
import {
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from '@/sanity/lib/live'
import {Suspense} from 'react'
import type {Metadata, ResolvingMetadata} from 'next'

const PAGE_QUERY = defineQuery(
  `*[_type == "page" && slug.current == $slug][0]{_id, _type, title, body}`,
)
const SLUGS_QUERY = defineQuery(`*[_type == $type && defined(slug.current)]{"slug": slug.current}`)

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  return sanityFetchStaticParams({query: SLUGS_QUERY, params: {type: 'page'}})
}

// --- generateMetadata ---

export async function generateMetadata(
  {params}: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const {slug} = await params
  const {perspective} = await getDynamicFetchOptions()
  const data = await cachedPageMetadata({slug, perspective})
  return {
    title: data?.title,
  }
}

async function cachedPageMetadata({
  slug,
  perspective,
}: {slug: string} & Pick<DynamicFetchOptions, 'perspective'>) {
  'use cache'
  const {data} = await sanityFetch({
    query: PAGE_QUERY,
    params: {slug},
    perspective,
    stega: false,
  })
  return data
}

// --- Page ---

export default async function PageRoute({params}: Props) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense fallback={<Template>Loading...</Template>}>
        <DynamicPageRoute params={params} />
      </Suspense>
    )
  }
  const {slug} = await params
  return <CachedPageRoute slug={slug} perspective="published" stega={false} />
}

async function DynamicPageRoute({params}: Props) {
  const {slug} = await params
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedPageRoute slug={slug} perspective={perspective} stega={stega} />
}

async function CachedPageRoute({
  slug,
  perspective,
  stega,
}: {slug: string} & Pick<DynamicFetchOptions, 'perspective' | 'stega'>) {
  'use cache'
  const {data} = await sanityFetch({query: PAGE_QUERY, params: {slug}, perspective, stega})
  return (
    <Template>
      <h1>{data?.title}</h1>
    </Template>
  )
}

function Template({children}: {children: React.ReactNode}) {
  return <div className="space-y-6">{children}</div>
}
```

---

## 12. `generateMetadata` Rules

- **Always resolve `perspective`** via `getDynamicFetchOptions()` -- this supports published content in production, drafts in draft mode, and Content Releases perspective switching in Presentation Tool
- **Always hard-code `stega: false`** -- stega encoding must never appear in titles, descriptions, or OG metadata
- **Delegate to a separate `cachedMetadata` function** with `'use cache'` -- do NOT put `'use cache'` on `generateMetadata` itself since it needs to call `getDynamicFetchOptions()`
- **If a query is shared** between `generateMetadata` and a cached component (where `stega` may be `true`), you **must** split into a separate `cachedMetadata` function. Never reuse a shared cached function that passes `stega` through.

---

## 13. Suspense Fallback Strategy

- **Preferred**: meaningful loading UI using a sync `Template` component that mirrors the cached component's layout. Better experience in Presentation Tool during Visual Editing.
- **Acceptable**: use `<CachedX perspective="published" stega={false} />` as the fallback -- users see stale published content while draft content streams in. Pragmatic when no skeleton exists.
- **Extract a `Template` component** for the static HTML shell. Reuse in both the Suspense fallback and the cached component output.

---

## 14. Key Differences from `cacheComponents: false`

- `sanityFetch` no longer reads `draftMode()` automatically -- pass `perspective` and `stega` explicitly
- `<SanityLive>` no longer reads `draftMode()` automatically -- pass `includeDrafts` explicitly
- `sanityFetch` calls `cacheTag()` and `cacheLife()` internally -- no manual cache tag management
- Use `sanityFetchStaticParams` (or `client.fetch()` directly) for `generateStaticParams` -- not `sanityFetch`
- Remove `export const dynamic = 'force-static'` -- not needed with cacheComponents
- Remove `notFound()` in draft mode paths -- you may be previewing a not-yet-published document

---

Sources:

- [EXPERIMENTAL-CACHE-COMPONENTS.md](https://github.com/sanity-io/next-sanity/blob/cache-components/packages/next-sanity/EXPERIMENTAL-CACHE-COMPONENTS.md)
- [Template PR #550](https://github.com/sanity-io/template-nextjs-personal-website/pull/550)
- [Template demo](https://github.com/sanity-io/template-nextjs-personal-website/tree/use-cache)
