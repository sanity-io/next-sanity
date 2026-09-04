# Live helpers: `client.ts`, `live.ts`, `proxy.ts`, and the root layout

## Contents

- [`client.ts`](#clientts)
- [`live.ts`](#livets)
- [`proxy.ts`](#proxyts)
- [`app/[perspective]/layout.tsx`](#appperspectivelayouttsx)
- [`sanityFetch`](#sanityfetch)
- [`cachedSanity`](#cachedsanity)
- [Without a `[perspective]` segment](#without-a-perspective-segment)
- [`sanityFetchMetadata`](#sanityfetchmetadata)
- [`generateStaticParams`](#generatestaticparams)

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

**If `client.ts` already exists**, leave its structure alone. Templates often centralize env-var reads in a separate `sanity/lib/api.ts` with an `assertValue` helper. Keep that. Append only what's missing.

- Use a modern `apiVersion` (for example today's date as a hardcoded string).
- `stega.studioUrl` enables stega encoding. It can be a relative string when an embedded Studio is mounted, otherwise an absolute URL (typically env-driven).
- Changing `apiVersion` or removing existing `stega.*` options can break callers.
- Never remove an existing `token` from `createClient`. Private datasets require a client token even for published-content fetches.

## `live.ts`

Create `src/sanity/lib/live.ts` alongside `client.ts`. If it already exists, append only what's missing.

`SANITY_API_READ_TOKEN` must never reach the client bundle. If the project already keeps it in a dedicated server-only module (commonly `src/sanity/lib/token.ts` with `import 'server-only'` at the top), import the token from there instead of inlining the `process.env` read.

```ts
// src/sanity/lib/live.ts
import {defineLive} from 'next-sanity/live'
import {perspective} from 'next/root-params'

import {client} from './client'

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}

export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  perspective,
})
```

`perspective` is the root param getter that `next typegen` generates for `app/[perspective]/`. It is only called inside draft mode, and its value is sanitized, so a raw route segment is fine and an unknown value falls back to `'drafts'`.

## `proxy.ts`

Create `proxy.ts` next to `app/` (or under `src/` if the app lives there). `definePerspectiveProxy` reads the draft mode bypass cookie and the `sanity-preview-perspective` cookie that Presentation Tool sets, and rewrites `/x` to `/<perspective>/x`. Without the bypass cookie the perspective is `published`, so the prerendered tree serves every anonymous visitor.

```ts
// proxy.ts
import {definePerspectiveProxy} from 'next-sanity/live/proxy'

export const proxy = definePerspectiveProxy()

// Next.js needs the matcher as a literal in this file.
export const config = {
  matcher: [
    '/((?!_next|_vercel|api|studio|favicon|\\.well-known|robots\\.|sitemap\\.|[^/]*\\.).*)?',
  ],
}
```

- The matcher excludes Next.js internals, API routes, the Studio, and any path with a dot (static files). Add other top-level routes that live outside `app/[perspective]/` to the exclusion list.
- A request the matcher excludes still reaches `app/[perspective]/` if no static route or `public/` file matches it, with the raw path segment as the perspective. Outside draft mode `sanityFetch` defaults to `published` anyway. Keep static assets in `public/` so they win over the dynamic segment.
- The `/published/...` prefix is not a public URL. A direct request to `/published` is rewritten to `/published/published` and 404s, which keeps canonical URLs unique.

## `app/[perspective]/layout.tsx`

Every page route moves under `app/[perspective]/`. The layout owns `generateStaticParams`, `<SanityLive>`, and `<VisualEditing>`.

```tsx
// src/app/[perspective]/layout.tsx
import {SanityLive} from '@/sanity/lib/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

export function generateStaticParams() {
  return [{perspective: 'published'}]
}

export default async function RootLayout({children}: LayoutProps<'/[perspective]'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

`<SanityLive>` derives `includeDrafts` from `draftMode()`. Pass the prop only to override it.

## `sanityFetch`

The fetcher returned by `defineLive`. It calls `cacheTag`/`cacheLife` internally, which **requires** a surrounding `'use cache'` scope. Call it inside a component or function that carries the directive:

```tsx
import {sanityFetch} from '@/sanity/lib/live'
import {defineQuery} from 'next-sanity'

const pageQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]`)

async function CachedPage({slug}: {slug: string}) {
  'use cache'
  const {data} = await sanityFetch({query: pageQuery, params: {slug}})
  return <article>{/* use `data` */}</article>
}
```

Inside the cached scope `sanityFetch` reads `draftMode()`. Outside draft mode the defaults are `perspective: 'published'` and `stega: false`, so the cached entry is the published one. Inside draft mode Next.js does not cache, the perspective comes from the resolver, and `stega` defaults to `true` so `<VisualEditing>` overlays work.

An explicit option always wins over the default, in either direction:

- `stega: false` keeps clean TypeGen types for data that never renders next to `<VisualEditing>` (route handlers, metadata).
- `perspective: 'published'` inside draft mode fetches published content on purpose, for example a "compare with live" panel.
- `perspective: 'drafts'` outside draft mode fetches drafts. Do this only in a dynamic, authenticated route, never in a cached leaf.

Never pass `perspective` or `stega` through props to reach a cached component. That was the v13 pattern and it is gone.

## `cachedSanity`

Optional. When many callers fetch data without caching their rendered JSX, a shared boundary in `live.ts` saves each of them a directive:

```ts
// src/sanity/lib/live.ts (continued)
import type {DefinedFetchType} from 'next-sanity/live'

export const cachedSanity: DefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}
```

`query` and `params` are the cache key. Two components fetching the same query share one entry. Use `cachedSanity` inside server actions and route handlers too, where a component-level directive is not available.

Reach for the bare `sanityFetch` with a component-level `'use cache'` when caching the rendered tree is worth it, for example an expensive Portable Text render.

## Without a `[perspective]` segment

Some apps cannot move every route under a dynamic root segment. Leave the `perspective` resolver off. Inside draft mode the perspective is then `'drafts'`, because `cookies()` cannot be read inside `'use cache'`:

```ts
export const {SanityLive, sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
```

```tsx
async function CachedPage({slug}: {slug: string}) {
  'use cache'
  const {data} = await sanityFetch({query: pageQuery, params: {slug}})
  return <article>{/* use `data` */}</article>
}
```

Content release previews in Presentation Tool need the release perspective, which this variant cannot see inside a cache. Prefer the `[perspective]` segment when releases matter.

## `sanityFetchMetadata`

`defineLive` also returns `sanityFetchMetadata` for `generateMetadata`, `generateViewport`, and the file-based metadata routes. It is `sanityFetch` with `stega` fixed to `false`, so `data` keeps its clean TypeGen type and `<title>` never carries stega characters. It owns its own `'use cache'` boundary, so call it directly:

```tsx
// src/app/[perspective]/[slug]/page.tsx
import type {Metadata} from 'next'

import {sanityFetchMetadata} from '@/sanity/lib/live'

export async function generateMetadata({
  params,
}: PageProps<'/[perspective]/[slug]'>): Promise<Metadata> {
  const {slug} = await params
  const {data} = await sanityFetchMetadata({query: pageQuery, params: {slug}})
  return {title: data?.title}
}
```

The `perspective` rule is the same as `sanityFetch`. Presentation Tool can open a standalone preview window, so metadata should reflect the previewed perspective too. `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` cannot read root params, so pass `perspective: 'published'` there:

```ts
// src/app/sitemap.ts
import type {MetadataRoute} from 'next'

import {sanityFetchMetadata} from '@/sanity/lib/live'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {data} = await sanityFetchMetadata({query: pageSlugsQuery, perspective: 'published'})
  return data.map((page) => ({url: `https://example.com/${page.slug}`}))
}
```

## `generateStaticParams`

Build-time code has no draft mode and no request, so `sanityFetch` is the wrong tool. Use the plain client with `perspective: 'published'`:

```ts
// src/app/[perspective]/[slug]/page.tsx
import {client} from '@/sanity/lib/client'
import {defineQuery} from 'next-sanity'

const pageSlugsQuery = defineQuery(
  `*[_type == "page" && defined(slug.current)]{"slug": slug.current}`,
)

export async function generateStaticParams() {
  return client.fetch(pageSlugsQuery, {}, {perspective: 'published'})
}
```

Every `[slug]` route under `[perspective]` needs a `generateStaticParams`, even a partial one. See [dynamic-segments.md](dynamic-segments.md).
