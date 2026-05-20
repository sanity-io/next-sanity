---
name: sanity-live-cache-components
description: Migrate next-sanity apps to cacheComponents - strict mode, three-layer component pattern, explicit perspective/stega/includeDrafts, prop-drilling conventions
---

# Sanity Live + Cache Components

You are an expert in Next.js who's aware that your training data is likely outdated, always read the relevant guide in `node_modules/next/dist/docs/` (when available) before writing any code.
If the guide conflicts with what is said in this skill, then follow this skill's instructions.
You will be integrating Sanity Live into your Next.js app, so that data is fetched with `sanityFetch` which calls `cacheTag` and `cacheLife` internally, and a `<SanityLive />` component is rendered in the root layout that handles revalidating cached content in response to live events sent by Sanity Content Lake over an EventSource connection. Your integration is sophisticated and ensures it fully supports Visual Editing and Presentation Tool, which is enabled when Next.js is in draft mode.

## Prerequisites

- You have upgraded to `next@16.2.x` or later.
- You have set up `AGENTS.md`, if not [see the guide](https://nextjs.org/docs/app/guides/ai-agents#existing-projects).
- You have a working Next.js 16+ app with the following environment variables set up already:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_READ_TOKEN`

---

## 1. Upgrade to `next-sanity@latest`

If `next-sanity@latest` isn't v13 yet then use `next-sanity@cache-components` instead, check with `npm dist-tag ls next-sanity`.

```bash
npm install next-sanity@^13 --save-exact
```

---

## 2. Configure `next.config.ts`

The `cacheComponents` flag must be set to `true`, and it's also recommended to set `cacheLife.default` to `sanity` so that the default revalidation time is 1 year instead of 15 minutes, as `sanityFetch` is optimized for on-demand revalidation and does not need any time-based revalidation.

```ts
// next.config.ts
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {default: sanity},
}

export default nextConfig
```

---

## 3. Configure `defineLive` and export `sanityFetch`, `<SanityLive>`, and other helpers

> **What dynamic APIs are allowed inside `'use cache'`?**
>
> - **Allowed (sole exception):** `await draftMode()` — you can read `isEnabled` inside a `'use cache'` boundary. Next.js automatically bypasses caching when Draft Mode is enabled, so draft content stays fresh. See the [official `use cache` reference](https://nextjs.org/docs/app/api-reference/directives/use-cache#draft-mode).
> - **Not allowed:** `await cookies()`, `await headers()`, `await props.params`, `await props.searchParams`, and any other request-bound dynamic API. These must be awaited outside the `'use cache'` boundary (typically in a `Dynamic*` wrapper) and passed in as plain serializable props.

### `client.ts`

Projects typically have a `src/sanity/lib/client.ts` file that exports a `const client = createClient({})`,
it should look roughly like this:

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

The `client.ts` file should use a modern `apiVersion` (for example today's date as a hardcoded string), and `stega: {studioUrl}` to enable stega encoding.
`stega.studioUrl` can be a relative string if there's a route that renders an embedded Sanity Studio, using `NextStudio` from `next-sanity/studio`. Otherwise it could be an absolute URL, typically set by an environment variable.

If the `client.ts` file already exists then don't overwrite it, extend it with options that are missing (append only from the above reference).
Giving `apiVersion` a new value, or removing other `stega.*` options can lead to breakage.
Never remove an existing `token` from `createClient`. Private datasets require a client token even for published-content fetches.

### `live.ts`

Create a `live.ts` file in the same directory as `client.ts` (unless it already exists, if so just add to it what's missing based on the below reference) that exports `sanityFetch`, `<SanityLive>`, and other helpers:

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

#### `sanityFetch`

For fetching data in React Server Components that have `'use cache'` directives and are eventually rendered in a `page.tsx` or `layout.tsx`.
The `stega` option is for Visual Editing support: when `stega: true`, with `stega.studioUrl` set in `createClient`, and with `<VisualEditing />` rendered in a root layout, this will render click-to-edit overlays on top of content.

- The `perspective` option is for switching between published and draft content, and specific Sanity Content Releases.
- The `getDynamicFetchOptions` helper also ensures that `perspective` is resolved from the `'sanity-preview-perspective'` cookie. This cookie is managed by `<VisualEditing>` when the app is rendered in a preview iframe within Presentation Tool in a Sanity Studio. The user can change which content release to preview, and the iframe automatically updates to show the content for the selected content release.

Any async function that calls `sanityFetch` should have a `'use cache'` or `'use cache: remote'` directive.
That async function boundary should take `perspective` and `stega` options as props. It should never hardcode them to `perspective: 'published'` or `stega: false`, as this would mean Visual Editing and previewing draft content (as well as specific content releases) won't work.

In other words, always do this:

```tsx
import {sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function CachedComponent({slug, perspective, stega}: {slug: string} & DynamicFetchOptions) {
  'use cache'
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetch({query: pageQuery, params: {slug}, perspective, stega})
}
```

Never do:

```tsx
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function CachedComponent({slug}: {slug: string}) {
  'use cache'
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetch({
    query: pageQuery,
    params: {slug},
    perspective: 'published',
    stega: false,
  }) // oh no, perspective and stega options are hardcoded!
}
```

If `sanityFetch` is called within a server action (boundary with `'use server'`) then you should never hardcode `perspective` or `stega` either, and also never take them as props to the server action function since server action inputs are considered untrusted and can be manipulated by the client and the underlying POST request.
Resolve them in the `'use server'` boundary, and pass them as props to a `'use cache'` boundary that calls `sanityFetch`.
In other words, always do this for server action functions:

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

Never do:

```tsx
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function fetchMore({page}: {page: string}) {
  'use cache'
  const pagesQuery = defineQuery(`*[_type == "page"][0...$page]`)
  const {data} = await sanityFetch({
    query: pagesQuery,
    params: {page},
    perspective: 'published',
    stega: false,
  }) // oh no, perspective and stega options are hardcoded!
  return data
}
async function renderMore({page}: {page: string}) {
  'use server'
  const data = await fetchMore({page})
}
```

```tsx
import {getDynamicFetchOptions, sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function renderMore({page}: {page: string}) {
  'use server'
  const {perspective, stega} = await getDynamicFetchOptions()
  const pagesQuery = defineQuery(`*[_type == "page"][0...$page]`)
  const {data} = await sanityFetch({query: pagesQuery, params: {page}, perspective, stega}) // oh no, sanityFetch is called in a 'use server' boundary directly, this means it won't be cached
}
```

If `sanityFetch` is called in a `route.ts` file, then you typically want to hardcode `stega: false` and only resolve `perspective`, as the route handler is unlikely to return a `Response` that will be rendered in the same DOM as a `<VisualEditing>` component and thus use the stega encoded strings to render overlays. Stega encoding is at best going to be ignored and bloat the payload size unnecessarily, and at worst can cause errors and unexpected behavior.

#### `sanityFetchMetadata`

For fetching data in `generateMetadata`, `generateSitemaps`, `generateViewport`, `generateImageMetadata` functions and `icon.tsx`, `apple-icon.tsx`, `manifest.ts`, `opengraph-image.tsx`, `twitter-image.tsx`, `robots.ts`, `sitemap.ts` files.

It's used the same way as `sanityFetch`, but without the ability to set `stega: true` as `sanityFetchMetadata` is designed to be used in contexts where stega encoding is never needed and should always be `false` and without the requirement of setting `'use cache'` at the callsite as the `sanityFetchMetadata` boundary itself already has it.

Presentation Tool supports opening an app in a new preview window, in addition to its preview iframe. To ensure that the correct content release is previewed when checking metadata like `<title>` and such it's necessary to resolve `perspective`, as with `sanityFetch`.

This means you should always do:

```ts
import {getDynamicFetchOptions, sanityFetchMetadata} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

export async function generateMetadata({params}: PageProps<'/[slug]'>) {
  const [{slug}, {perspective}] = await Promise.all([params, getDynamicFetchOptions()])
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetchMetadata({query: pageQuery, params: {slug}, perspective})
}
```

Never do:

```ts
import {sanityFetchMetadata} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

export async function generateMetadata({params}: PageProps<'/[slug]'>) {
  'use cache'
  const {slug} = await params
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetchMetadata({
    query: pageQuery,
    params: {slug},
    perspective: 'published', // oh no, perspective is hardcoded and perspective switching won't work
  })
}
```

#### `getDynamicFetchOptions`

Since `sanityFetch` is designed to be called inside a `'use cache'` boundary, we need to resolve `perspective` and `stega` options outside of it and pass them as props.
Resolving `perspective` calls a dynamic API, `cookies()`, so it needs to happen in a component that is wrapped in `<Suspense>` so that it does not block the rest of the page from streaming. Avoid calling `getDynamicFetchOptions` in the body of a `layout.tsx` or `page.tsx` that should remain part of the static shell. The exception is routes that intentionally use a sibling `loading.tsx` for fallback UI (see the dynamic segments section), in which case the page can await `getDynamicFetchOptions` directly because `loading.tsx` provides the streaming fallback.
When Cache Components are enabled, `<Suspense>` boundaries determine what's part of the static shell that is prerendered during `next build` and what is streamed in at runtime. For fully prerendered routes, only render these `<Suspense>` boundaries in draft mode.

Here's an example of what that looks like for a `<Footer>` component in a `layout.tsx` that fetches data:

```tsx
// src/app/(website)/layout.tsx

import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {draftMode} from 'next/headers'
import {Suspense} from 'react'

export default async function WebsiteLayout({children}: LayoutProps<'/'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <>
      {children}
      {isDraftMode ? (
        <Suspense fallback={<FooterFallback />}>
          <DynamicFooter />
        </Suspense>
      ) : (
        <Footer perspective="published" stega={false} />
      )}
    </>
  )
}
async function DynamicFooter() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <Footer perspective={perspective} stega={stega} />
}
async function Footer({perspective, stega}: DynamicFetchOptions) {
  'use cache'
  const footerQuery = defineQuery(`*[_type == "footer"][0]`)
  const {data} = await sanityFetch({query: footerQuery, perspective, stega})
  return <footer>{/* use `data` to render stuff */}</footer>
}
function FooterFallback() {
  return (
    <footer>
      <p>Loading footer...</p>
    </footer>
  )
}
```

In this example the `<Footer perspective="published" stega={false} />` is able to be part of the static shell during prerender, so the whole layout is properly cached and only revalidated whenever content used by the `sanityFetch` call in `Footer` changes. While also ensuring that while in draft mode the page does not block on the `sanityFetch` call and the layout can render immediately, using its static shell while the `<DynamicFooter>` is streaming in at the `<Suspense>` boundary. If it's fast enough then `<FooterFallback>` will never show.

#### `sanityFetchStaticParams`

When fetching data in a `generateStaticParams` function, then we never want `stega` since the data is used to generate route params, and we also know that this function is only called at `next build` time so there is no point in trying to resolve a `perspective` from `cookies`, as it's never run at request time where there might be cookies.

In other words, never call `sanityFetch` in a `generateStaticParams` function, always use `sanityFetchStaticParams`. Never call `sanityFetchStaticParams` outside of a `generateStaticParams` function.

---

## 4. Render `<SanityLive>` in a root layout

The `<SanityLive>` component exported from `defineLive` should be in the root layout.
Usually that is `src/app/layout.tsx`, and is also where `<VisualEditing />` from `next-sanity/visual-editing` is rendered. Regardless of how the Next.js app might be using Route Groups and nested layouts and pages, the `<SanityLive>` and `<VisualEditing>` components should be in a `layout.tsx`, not a `page.tsx`. At any point in time both components should at most be rendered once, rendering the same component multiple times is undefined behavior and can cause unexpected problems.

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

### Dealing with embedded Sanity Studio

If there's a route that renders an embedded Sanity Studio, using `NextStudio` from `next-sanity/studio`, then the `<SanityLive>` needs to be in a layout that won't be used by the embedded studio, using [route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups).
For example, if `NextStudio` is used on `app/studio/[[...index]]/page.tsx`, then the `<SanityLive>` needs to be in `src/app/(website)/layout.tsx` and the rest of the app should be in `src/app/(website)`.

---

## 5. The Three-Layer Component Pattern

This is the core architecture for every route that can be fully statically prerendered and cached.

### Structure

```
Page/Layout (Layer 1)
  ├── NOT draft mode → <CachedX perspective="published" stega={false} />  (no Suspense)
  └── draft mode → <Suspense fallback={...}>
                      <DynamicX params={params} />  (Layer 2)
                        └── <CachedX params={await params} perspective={p} stega={s} />  (Layer 3)
```

### Example with a `[slug]/page.tsx` route

The layer examples below showcase how to handle params on a `/[slug]/page.tsx` route, which requires a `generateStaticParams` function like the one below:

```tsx
// src/app/[slug]/page.tsx
import {sanityFetchStaticParams} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

export async function generateStaticParams() {
  const pageSlugsQuery = defineQuery(
    `*[_type == "page" && defined(slug.current)]{"slug": slug.current}`,
  )
  const {data} = await sanityFetchStaticParams({query: pageSlugsQuery})
  return data
}
```

On routes like `/layout.tsx` or `/page.tsx` you can omit the `params` handling.

### Layer 1: Page Component

Calls `draftMode()` and branches:

```tsx
// src/app/[slug]/page.tsx (continued)
import {draftMode} from 'next/headers'
import {Suspense} from 'react'

export default async function Page({params}: PageProps<'/[slug]'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense
        // optional, but highly recommended, a good fallback skeleton should not cause layout shift when `<Suspense>` transitions from showing `fallback` to `children`
        fallback={<PageFallback />}
      >
        <DynamicPage
          // do not await `params` here, it needs to be awaited in `<DynamicPage>` for the Suspense boundary to work
          params={params}
        />
      </Suspense>
    )
  }
  const {slug} = await params
  return <CachedPage slug={slug} perspective="published" stega={false} />
}
```

- `Page` should not have a `'use cache'` directive. `draftMode()` itself is allowed inside `'use cache'`, but `Page` also awaits `params` and (in routes that need it, such as Case 1 in section 7) calls `getDynamicFetchOptions()`, which calls `cookies()` whenever `draftMode().isEnabled`. `cookies()`, `headers()`, `await params`, and `await searchParams` are not allowed inside `'use cache'` (even when draft mode is active and the cache layer is bypassed). It's enough for `<CachedPage>` (Layer 3) to carry `'use cache'` for `Page` to also be prerendered as part of the static shell.
- Requires `generateStaticParams` if `params` is used as input to `sanityFetch`
- **Not in draft mode**: no `<Suspense>` boundary, maximizes static shell
- **In draft mode**: render `<DynamicPage />` in a `<Suspense>` boundary, preferably with a good fallback skeleton as it'll suspend twice:
  1. first suspend when `<DynamicPage>` is rendered as it will `await getDynamicFetchOptions()`
  2. second suspend when `<CachedPage />` is rendered as it will `await sanityFetch()` using the `perspective` and `stega` options resolved by `<DynamicPage>`

#### `searchParams` and other dynamic APIs

If you need to use `searchParams` or other dynamic APIs (or `params` without providing `generateStaticParams` or a `loading.tsx` for the route, see [the guide for deciding whether to use `loading.tsx` or `<Suspense>`](https://nextjs.org/docs/app/guides/streaming#when-to-use-loadingjs-vs-suspense)) as input to `sanityFetch`, then you should always render the `<Suspense>` tree and no longer branch on `draftMode`:

```tsx
// src/app/[slug]/page.tsx (continued)
import {Suspense} from 'react'

// Do not export an async function here, to avoid accidentally blocking render while awaiting a dynamic API
export default function Page({params}: PageProps<'/[slug]'>) {
  return (
    <Suspense
      // not optional since we no longer branch on `draftMode`, not providing a skeleton means Suspense will render `null`, causing massive layout shift that users hate
      fallback={<PageFallback />}
    >
      <DynamicPage
        // do not await `params` here, it needs to be awaited in `<DynamicPage>` for the Suspense boundary to work
        params={params}
      />
    </Suspense>
  )
}
```

### Layer 2: Dynamic Component

Since `<CachedPage>` has `'use cache'` it's not allowed to call `cookies()`, `headers()`, `await props.params`, or `await props.searchParams` — these must be resolved in `<DynamicPage>` and passed as plain props. `draftMode()` is the one exception and can be read directly inside `<CachedPage>`, but in this pattern it's not needed there because `perspective` and `stega` already encode the draft state via `getDynamicFetchOptions()`.

```tsx
// src/app/[slug]/page.tsx (continued)
import {getDynamicFetchOptions} from '@/sanity/lib/live'

async function DynamicPage({params}: Pick<PageProps<'/[slug]'>, 'params'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])

  return <CachedPage slug={slug} perspective={perspective} stega={stega} />
}
```

### Layer 3: Cached Component

Has `'use cache'` and only receives plain, serializable props:

```tsx
// src/app/[slug]/page.tsx (continued)
import {sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

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

---

## 6. Non-blocking data fetching for `layout.tsx` in draft mode

When using `sanityFetch` in a `layout.tsx` file then it's important to keep these constraints in mind when implementing the 3-layer pattern:

- The top-level component in `layout.tsx` should not `await` any dynamic APIs or perform data fetching, it can reduce the static shell, and it slows down streaming in draft mode.
- Data fetching, and [dynamic API calls, should be pushed closer to where it's used](https://nextjs.org/docs/app/guides/streaming#push-dynamic-access-down).
- Shared data fetching can be extracted to a reused async `use cache` boundary function to reduce the footprint of multiple components that need the same data and to reduce latency in draft mode.

In other words, do this:

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

Never do this:

```tsx
// src/app/(website)/layout.tsx
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {draftMode} from 'next/headers'
import type {ReactNode} from 'react'
import {Suspense} from 'react'

export default async function WebsiteLayout({children}: LayoutProps<'/'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense>
        <DynamicWebsiteLayout>{children}</DynamicWebsiteLayout>
      </Suspense>
    )
  }
  return (
    <CachedWebsiteLayout perspective="published" stega={false}>
      {children}
    </CachedWebsiteLayout>
  )
}
async function DynamicWebsiteLayout({children}: {children: ReactNode}) {
  const {perspective, stega} = await getDynamicFetchOptions()
  return (
    <CachedWebsiteLayout perspective={perspective} stega={stega}>
      {children}
    </CachedWebsiteLayout>
  )
}
async function CachedWebsiteLayout({
  children,
  perspective,
  stega,
}: {children: ReactNode} & DynamicFetchOptions) {
  'use cache'
  const settingsQuery = defineQuery(`*[_type == "settings"][0]`)
  const {data} = await sanityFetch({query: settingsQuery, perspective, stega})

  return (
    <>
      <Navbar data={data} />
      {children}
      <Footer data={data} />
    </>
  )
}
```

---

## 7. High performance [`Dynamic Segments`](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)

It's always recommended that routes with dynamic segments make sure to implement `generateStaticParams`, even if it's just a subset of all pages. [Read more.](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes#with-cache-components)
Whether you use `loading.tsx` or `<Suspense>` to show fallback UI depends on the use case. [Read more.](https://nextjs.org/docs/app/guides/streaming#when-to-use-loadingjs-vs-suspense)

This section will guide you through 2 different implementations and their pros and cons.

### Case 1: `page.tsx` prerendering 100 most recently updated pages with instant loading states

A `generateStaticParams` queries only the 100 most recently updated pages, with fallback UI implemented in a `loading.tsx` so that the `page.tsx` itself does not need to use `<Suspense>`, and the same fallback UI is used in draft mode as well.
This case can scale to thousands of pages, without slowing down your `next build` time to a grinding halt, and without compromising the UX in production:

- prerendered pages load instantly.
- pages not prerendered start rendering when hovering a `<Link>` (or scrolling the `<Link>` into view) so that on `click` it:
  - if it prerendered in time it'll serve the new page instantly, no loading state.
  - if it didn't prerender in time it'll instantly show the fallback UI, as the `loading.tsx` is prefetched from cache.

Add a sibling `src/app/[slug]/loading.tsx` that renders the same fallback skeleton you would otherwise pass to `<Suspense>`.

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

// Since there is a sibling `loading.tsx` file, we don't need a `<Suspense>` wrapper and a `DynamicPage` intermediate component, we can await `params` and `getDynamicFetchOptions` directly in the `Page` component.
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

### Case 2: `layout.tsx` non-blocking data fetching using dynamic `params`

A `layout.tsx` can't use `loading.tsx` to implement fallback UI, [as it's one level higher](https://nextjs.org/docs/app/getting-started/project-structure#component-hierarchy). And so a different pattern is needed in order to efficiently fetch data that uses dynamic `params` without blocking the `children` from streaming in.

```tsx
// src/app/(website)/[slug]/layout.tsx

import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

export default function WebsiteLayout({children, params}: LayoutProps<'/[slug]'>) {
  return (
    <>
      {children}
      {/* The footer renders below the fold so it doesn't need a fallback */}
      <Suspense>
        <DynamicFooter
          // Don't await `params`, pass the promise and await within the `<Suspense>` boundary so `children` isn't blocked and can stream in parallel
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

---
