> [!NOTE]
> Cache components support is now stable in `next-sanity` v13+ (currently `latest`). See the [v13 changelog](https://www.sanity.io/changelog/1b810aef-7d2e-4422-bece-dc317bbd2995) for details.
> It requires `cacheComponents` to be enabled in your `next.config.ts`, and this guide assumes `next@16.2.x` or later.

# Sanity Live with Next.js Cache Components

This guide shows how to configure `next-sanity` for `cacheComponents: true`. The important difference from traditional Sanity Live usage is that `sanityFetch` must run inside cached boundaries, while request-time values such as `draftMode()` and cookies must be resolved outside those boundaries and passed in as props.

## Automate the migration with an agent

This repository includes a `sanity-live-cache-components` skill that can guide an agent through the migration. It is especially useful because draft mode and published mode have different rendering constraints, and `next build --debug-prerender` is not enough to verify draft mode behavior.

```bash
npx skills add https://github.com/sanity-io/next-sanity --skill sanity-live-cache-components
```

Suggested prompt:

```txt
Use the /sanity-live-cache-components skill to migrate this app to use Cache Components. When verifying with next dev, test both draft mode enabled and draft mode disabled because each mode has different rendering rules.
```

For best agent results, set up [`AGENTS.md`](https://nextjs.org/docs/app/guides/ai-agents#existing-projects) in the target app.

## Full working example

See the personal website template for a complete working example:

- [Code](https://github.com/sanity-io/template-nextjs-personal-website/tree/use-cache)
- [Demo](https://template-nextjs-personal-website-git-use-cache.sanity.dev/)
- [Deploy demo to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsanity-io%2Ftemplate-nextjs-personal-website%2Ftree%2Fuse-cache&project-name=nextjs-personal-website&repository-name=nextjs-personal-website&demo-title=Personal+Website+with+Built-in+Content+Editing&demo-description=A+Sanity-powered+personal+website+with+built-in+content+editing+and+instant+previews.+Uses+App+Router.&demo-url=https%3A%2F%2Ftemplate-nextjs-personal-website.sanity.build%2F&demo-image=https%3A%2F%2Fuser-images.githubusercontent.com%2F6951139%2F206395107-e58a796d-13a9-400a-94b6-31cb5df054ab.png&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22other%22%2C%22productSlug%22%3A%22project%22%2C%22integrationSlug%22%3A%22sanity%22%7D%5D)

# Setup

Install `next-sanity@latest` (v13+):

```bash
npm install next-sanity@latest
```

## 1. Configure `next.config.ts`

In your `next.config.ts`, enable `cacheComponents` and add the Sanity `cacheLife` preset. Sanity Live handles on-demand revalidation, so cached Sanity data should not rely on the default 15 minute time-based revalidation.

```ts
// next.config.ts

import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {default: sanity},
} satisfies NextConfig

export default nextConfig
```

## 2. Configure the Sanity client

Projects typically have a `src/sanity/lib/client.ts` file. It should use a modern `apiVersion`, default to the published perspective, and configure `stega.studioUrl` for Visual Editing:

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

If this file already exists, extend it rather than overwriting it. Changing `apiVersion` or removing existing `stega.*` options can break an app.

## 3. Configure `defineLive`

Create a `live.ts` file next to `client.ts`. Use `strict: true` so TypeScript requires every `sanityFetch` call to pass `perspective` and `stega`, and every `<SanityLive />` render to pass `includeDrafts`.

You also need helpers for the places where Sanity data is fetched outside normal React Server Component rendering.

```tsx
// src/sanity/lib/live.ts

import {type QueryParams} from 'next-sanity'
import {defineLive, resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import {client} from './client'

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  // The browser token is exposed to browsers in draft/live preview.
  // It must be read-only and scoped to the minimum required permissions.
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

## 4. Render `<SanityLive />` in a root layout

Render `<SanityLive />` once in a root layout and pass `includeDrafts={isDraftMode}`. Render `<VisualEditing />` only in draft mode.

```tsx
// src/app/layout.tsx

import {SanityLive} from '@/sanity/lib/live'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

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

If the app has an embedded Sanity Studio route, for example `app/studio/[[...index]]/page.tsx`, put `<SanityLive />` in a route-group layout that the Studio route does not use, such as `src/app/(website)/layout.tsx`.

## 5. Fetching data with `sanityFetch`

> [!IMPORTANT]
> [Read the intro on `'use cache'` and `'use cache: remote'` directives before you proceed.](https://nextjs.org/docs/app/getting-started/cache-components#using-use-cache)

Cache components introduce a layered caching system, and so you need to define cache boundaries yourself depending on your application's needs and how dynamic or cacheable the data you're fetching is.

### Key difference from `cacheComponents: false`

When `cacheComponents: false`, `sanityFetch` can read `draftMode()` to set `perspective` and `stega` for you. When `cacheComponents: true`, Next.js does not allow request-time APIs like `draftMode()` and `cookies()` inside `'use cache'` boundaries.

To handle this, use a three-layer structure:

1. Page/layout component: branches on `draftMode()` when the route can be prerendered.
2. Dynamic component: resolves `params`, `cookies()`, and `getDynamicFetchOptions()` outside the cache boundary.
3. Cached component: has `'use cache'` and receives serializable props, including `perspective` and `stega`.

Under the hood `sanityFetch` automatically calls [the `cacheTag()` API](https://nextjs.org/docs/app/api-reference/functions/cacheTag) and [the `cacheLife()` API](https://nextjs.org/docs/app/api-reference/functions/cacheLife), so you can focus on defining your query and params.

Keep these rules in mind:

- Any async function that calls `sanityFetch` should have a `'use cache'` or `'use cache: remote'` directive.
- Do not hardcode `perspective: 'published'` or `stega: false` inside cached components that render page content. Resolve those values outside the cache boundary and pass them in as props.
- Do not take `perspective` or `stega` as server action input. Server action inputs are untrusted; resolve them inside the server action and pass them to a cached helper.
- In `route.ts` handlers, use `stega: false` unless the response is rendered into the same DOM as `<VisualEditing />`.

### Static routes

```tsx
// src/app/page.tsx

import {draftMode} from 'next/headers'
import {defineQuery} from 'next-sanity'
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {Suspense} from 'react'

const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current)][0...$limit]{_id,slug,title}`,
)

export default async function Page() {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense fallback={<section>Loading&hellip;</section>}>
        <DynamicProductsList />
      </Suspense>
    )
  }
  return <CachedProductsList perspective="published" stega={false} />
}

async function DynamicProductsList() {
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedProductsList perspective={perspective} stega={stega} />
}

async function CachedProductsList({perspective, stega}: DynamicFetchOptions) {
  'use cache'

  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params: {limit: 10},
    perspective,
    stega,
  })

  return (
    <section>
      {products.map((product) => (
        <article key={product._id}>
          <a href={`/product/${product.slug}`}>{product.title}</a>
        </article>
      ))}
    </section>
  )
}
```

### Dynamic routes with `params`

In Next.js 16+, `params` is a `Promise`. For routes where `params` is used as input to `sanityFetch`, implement `generateStaticParams()` and use `sanityFetchStaticParams()`.

The dynamic layer unwraps both `params` and the fetch options before passing plain, serializable values to the cached component:

```tsx
// src/app/product/[slug]/page.tsx

import {draftMode} from 'next/headers'
import {defineQuery} from 'next-sanity'
import {
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from '@/sanity/lib/live'
import {Suspense} from 'react'

const SLUGS_BY_TYPE_QUERY = defineQuery(`
  *[_type == $type && defined(slug.current)]{"slug": slug.current}
`)
const PRODUCT_QUERY = defineQuery(
  `*[_type == "product" && slug.current == $slug][0]{_id,slug,title,description}`,
)

export async function generateStaticParams() {
  const {data} = await sanityFetchStaticParams({
    query: SLUGS_BY_TYPE_QUERY,
    params: {type: 'product'},
  })
  return data
}

export default async function ProductPage({params}: PageProps<'/product/[slug]'>) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (isDraftMode) {
    return (
      <Suspense fallback={<section>Loading product&hellip;</section>}>
        <DynamicProductPage params={params} />
      </Suspense>
    )
  }
  const {slug} = await params
  return <CachedProductPage slug={slug} perspective="published" stega={false} />
}

async function DynamicProductPage({params}: Pick<PageProps<'/product/[slug]'>, 'params'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  return <CachedProductPage slug={slug} perspective={perspective} stega={stega} />
}

async function CachedProductPage({
  slug,
  perspective,
  stega,
}: Awaited<PageProps<'/product/[slug]'>['params']> & DynamicFetchOptions) {
  'use cache'

  const {data: product} = await sanityFetch({
    query: PRODUCT_QUERY,
    params: {slug},
    perspective,
    stega,
  })

  return (
    <article>
      <h1>{product?.title}</h1>
    </article>
  )
}
```

`PageProps<'/product/[slug]'>` is provided by Next.js's `next typegen` output, so the params are typed from the route segment without having to define a `Props` type by hand.

### Caching `generateMetadata`

Metadata should not use stega encoding, but it should still resolve `perspective` so Presentation Tool can preview draft content and content releases in a new preview window. Use `sanityFetchMetadata()` and pass the resolved `perspective`.

```tsx
// src/app/product/[slug]/page.tsx

import type {Metadata, ResolvingMetadata} from 'next'
import {getDynamicFetchOptions, sanityFetchMetadata} from '@/sanity/lib/live'

export async function generateMetadata(
  {params}: PageProps<'/product/[slug]'>,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const [{slug}, {perspective}] = await Promise.all([params, getDynamicFetchOptions()])
  const {data: product} = await sanityFetchMetadata({
    query: PRODUCT_QUERY,
    params: {slug},
    perspective,
  })
  return {
    title: product?.title,
    description: product?.description ?? (await parent).description,
  }
}
```

### Routes with `loading.tsx`

If a dynamic route has a sibling `loading.tsx`, the route can rely on that fallback instead of adding its own `<Suspense>` boundary. In that case it can await `params` and `getDynamicFetchOptions()` directly in the page component before rendering a cached component:

```tsx
// src/app/product/[slug]/page.tsx

export default async function ProductPage({params}: PageProps<'/product/[slug]'>) {
  const [{slug}, {perspective, stega}] = await Promise.all([params, getDynamicFetchOptions()])
  return <CachedProductPage slug={slug} perspective={perspective} stega={stega} />
}
```

Without a sibling `loading.tsx`, keep request-time work in a dynamic component wrapped by `<Suspense>`.

## Verify both modes

Run the app with `next dev` and test both draft mode enabled and draft mode disabled. `next build --debug-prerender` can catch prerendering issues, but it does not prove that draft mode, Presentation Tool perspective switching, or Visual Editing overlays work correctly.
