# Live helpers: `client.ts` and `live.ts`

## Contents

- [`client.ts`](#clientts)
- [`live.ts`](#livets)
- [`cachedSanity`](#cachedsanity)
- [`sanityFetch`](#sanityfetch)
- [`cachedSanityMetadata`](#cachedsanitymetadata)
- [`getDynamicFetchOptions`](#getdynamicfetchoptions)
- [`cachedSanityStaticParams`](#cachedsanitystaticparams)
- [Anti-patterns to grep for](#anti-patterns-to-grep-for)

## `client.ts`

Projects typically have a `src/sanity/lib/client.ts` that exports a `createClient` instance.

**If no `client.ts` exists yet**, use this shape as a starting point:

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

**If `client.ts` already exists**, leave its structure alone. Templates often centralize env-var reads in a separate `sanity/lib/api.ts` with an `assertValue` helper — keep that. Append only what's missing.

- Use a modern `apiVersion` (e.g. today's date as a hardcoded string).
- `stega.studioUrl` enables stega encoding. It can be a relative string when an embedded Studio is mounted via `NextStudio` from `next-sanity/studio`, otherwise an absolute URL (typically env-driven).
- Changing `apiVersion` or removing existing `stega.*` options can break callers.
- Never remove an existing `token` from `createClient`. Private datasets require a client token even for published-content fetches.

## `live.ts`

Create `src/sanity/lib/live.ts` alongside `client.ts`. If it already exists, append only what's missing.

`SANITY_API_READ_TOKEN` must never reach the client bundle. If the project already keeps it in a dedicated server-only module (commonly `src/sanity/lib/token.ts` with `import 'server-only'` at the top), import the token from there instead of inlining the `process.env` read. The example below inlines it for brevity — swap in the existing module if there is one.

```ts
// src/sanity/lib/live.ts
import {type QueryParams} from 'next-sanity'
import {
  defineLive,
  resolvePerspectiveFromCookies,
  type LivePerspective,
  type StrictDefinedFetchType,
} from 'next-sanity/live'
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

// The app's one shared 'use cache' boundary. `sanityFetch` calls
// `cacheTag`/`cacheLife` internally but doesn't create the boundary —
// this wrapper provides it once, so callers don't add their own.
export const cachedSanity: StrictDefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}

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
export async function cachedSanityStaticParams<const QueryString extends string>({
  query,
  params = {},
}: {
  query: QueryString
  params?: QueryParams
}) {
  const {data} = await cachedSanity({query, params, perspective: 'published', stega: false})
  return {data}
}

// For usage within `generateMetadata` and `generateViewport`
export async function cachedSanityMetadata<const QueryString extends string>({
  query,
  params = {},
  perspective,
}: {
  query: QueryString
  params?: QueryParams
  perspective: LivePerspective
}) {
  const {data} = await cachedSanity({query, params, perspective, stega: false})
  return {data}
}
```

## `cachedSanity`

The default way to fetch Sanity content anywhere server-side: React Server Components, layouts, server actions, and route handlers. It is `sanityFetch` wrapped in the app's single shared `'use cache'` boundary, so callers don't declare `'use cache'` themselves.

Why it works:

- `perspective`, `stega`, `query`, and `params` are all serializable arguments, so they become part of the cache key automatically — published and draft content never share a cache entry, and identical fetches from different components deduplicate into one entry.
- `sanityFetch` calls `cacheTag()` (with Content Lake sync tags) and `cacheLife()` inside the wrapper's cache scope, so `<SanityLive>` revalidation targets each entry precisely.
- When draft mode is enabled, Next.js bypasses `'use cache'`, so draft content stays fresh per request without extra handling.

The component calling it must still take `perspective` and `stega` as props (or resolve them via `getDynamicFetchOptions` outside the static shell). Never hardcode them in shared components.

Pattern:

```tsx
import {cachedSanity, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function CachedComponent({slug, perspective, stega}: {slug: string} & DynamicFetchOptions) {
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await cachedSanity({query: pageQuery, params: {slug}, perspective, stega})
}
```

Anti-pattern (hardcoded options break Visual Editing and content-release previewing):

```tsx
async function CachedComponent({slug}: {slug: string}) {
  const {data} = await cachedSanity({
    query: pageQuery,
    params: {slug},
    perspective: 'published', // hardcoded
    stega: false, // hardcoded
  })
}
```

### Inside server actions

`'use server'` boundaries cannot accept `perspective`/`stega` as inputs (server action inputs are untrusted). Resolve them inside the `'use server'` function and forward them to `cachedSanity`:

```tsx
import {cachedSanity, getDynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function renderMore({page}: {page: string}) {
  'use server'
  const {perspective, stega} = await getDynamicFetchOptions()
  const pagesQuery = defineQuery(`*[_type == "page"][0...$page]`)
  const {data} = await cachedSanity({query: pagesQuery, params: {page}, perspective, stega})
}
```

Anti-patterns:

- Hardcoding `perspective`/`stega` inside the action.
- Calling the bare `sanityFetch` inside `'use server'` — it has no cache boundary there.

### Inside `route.ts`

Use `cachedSanity` with `stega: false` hardcoded, and resolve only `perspective`. Route handlers don't render a DOM next to `<VisualEditing>`, so stega encoding only inflates the payload (and can cause downstream errors).

## `sanityFetch`

The bare fetcher returned by `defineLive`. It calls `cacheTag`/`cacheLife` internally, which **requires** a surrounding `'use cache'` scope — so the only place to call it directly is inside a component (or function) that carries its own `'use cache'` directive:

```tsx
import {sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

async function CachedPage({slug, perspective, stega}: {slug: string} & DynamicFetchOptions) {
  'use cache'
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await sanityFetch({query: pageQuery, params: {slug}, perspective, stega})
  return <article>{/* expensive rendering, cached alongside the data */}</article>
}
```

Reach for this instead of `cachedSanity` only when caching the rendered JSX (not just the data) is worth an extra boundary — e.g. an expensive Portable Text render tree. The same rules apply: take `perspective` and `stega` as props, never hardcode them.

- `perspective` switches between published, drafts, and specific Sanity Content Releases.
- `stega: true` (combined with `stega.studioUrl` in `createClient` and `<VisualEditing>` in the root layout) renders click-to-edit overlays.
- `getDynamicFetchOptions` resolves `perspective` from the `sanity-preview-perspective` cookie, which `<VisualEditing>` manages when the app is rendered inside Presentation Tool's preview iframe.

## `cachedSanityMetadata`

For fetching data inside `generateMetadata`, `generateSitemaps`, `generateViewport`, `generateImageMetadata`, and the file-based metadata routes (`icon.tsx`, `apple-icon.tsx`, `manifest.ts`, `opengraph-image.tsx`, `twitter-image.tsx`, `robots.ts`, `sitemap.ts`).

It's `cachedSanity` with `stega` pinned to `false` (never wanted in these contexts).

Presentation Tool can open an app in a standalone preview window, so the correct content release must still be reflected in `<title>` and friends. Always resolve `perspective`:

```ts
import {getDynamicFetchOptions, cachedSanityMetadata} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

export async function generateMetadata({params}: PageProps<'/[slug]'>) {
  const [{slug}, {perspective}] = await Promise.all([params, getDynamicFetchOptions()])
  const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)
  const {data} = await cachedSanityMetadata({query: pageQuery, params: {slug}, perspective})
}
```

Anti-pattern: hardcoding `perspective: 'published'` — content-release previewing won't work.

## `getDynamicFetchOptions`

Resolves `perspective` and `stega` outside the `'use cache'` boundary so they can be passed in as plain props. Calls `cookies()`, which is a dynamic API, so the call must live inside a `<Suspense>` boundary (or a route with a sibling `loading.tsx`) so it doesn't block the static shell from streaming.

Avoid calling `getDynamicFetchOptions` in the top-level body of a `layout.tsx` or `page.tsx` that should remain part of the static shell. The exception is routes that intentionally use a sibling `loading.tsx` for fallback UI (see [dynamic-segments.md](dynamic-segments.md)) — there the page can await `getDynamicFetchOptions` directly because `loading.tsx` provides the streaming fallback.

When Cache Components are enabled, `<Suspense>` boundaries determine the static shell. For fully prerendered routes, render the Suspense tree only when in draft mode — see [three-layer-pattern.md](three-layer-pattern.md).

## `cachedSanityStaticParams`

Used inside `generateStaticParams`. `stega` is never wanted (the data feeds route params), and `perspective` cookies aren't available at build time anyway, so both are hardcoded.

- Never call `sanityFetch` or `cachedSanity` directly inside `generateStaticParams` — always use `cachedSanityStaticParams` (which fetches through `cachedSanity` internally).
- Never call `cachedSanityStaticParams` outside `generateStaticParams`.

## Anti-patterns to grep for

When migrating an existing app, these are the strings to search for and refactor:

- `perspective: 'published'` and `stega: false` hardcoded together in a `sanityFetch` / `cachedSanity` call inside a shared component → replace with `perspective` and `stega` props sourced from `getDynamicFetchOptions` via the three-layer pattern.
- `sanityFetch(` directly inside a function whose body starts with `'use server'` → swap for `cachedSanity` and resolve `perspective`/`stega` via `getDynamicFetchOptions` inside the action.
- `sanityFetch(` in a component without its own `'use cache'` directive → swap for `cachedSanity` (or add the directive if caching the rendered JSX is intended).
- `sanityFetch(` inside `generateStaticParams` → swap for `cachedSanityStaticParams`.
- `sanityFetch(` inside `generateMetadata` / `generateViewport` / `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` etc. → swap for `cachedSanityMetadata` and resolve `perspective` via `getDynamicFetchOptions`.
- `await draftMode()` immediately followed by `await getDynamicFetchOptions()` at the top of a `page.tsx` or `layout.tsx` without a sibling `loading.tsx` → move the dynamic-API calls into a child component wrapped in `<Suspense>` so the static shell can prerender.
