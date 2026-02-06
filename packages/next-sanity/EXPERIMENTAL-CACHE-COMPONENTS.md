> [!CAUTION]
> The experimental `next-sanity@cache-components` canary release is not yet stable and could have breaking changes in `minor`, and `patch`, releases.
> It requires `cacheComponents` to be enabled in your `next.config.ts`, which was introduced in [`next@16.0.0`](https://nextjs.org/blog/next-16#cache-components).

# Full working example

See the personal website template for a complete working example, it's BLAZING FAST :fire::fire::fire::

- [Code](https://github.com/sanity-io/template-nextjs-personal-website/tree/use-cache)
- [Demo](https://template-nextjs-personal-website-git-use-cache.sanity.dev/)
- [Deploy demo to vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsanity-io%2Ftemplate-nextjs-personal-website%2Ftree%2Fuse-cache&project-name=nextjs-personal-website&repository-name=nextjs-personal-website&demo-title=Personal+Website+with+Built-in+Content+Editing&demo-description=A+Sanity-powered+personal+website+with+built-in+content+editing+and+instant+previews.+Uses+App+Router.&demo-url=https%3A%2F%2Ftemplate-nextjs-personal-website.sanity.build%2F&demo-image=https%3A%2F%2Fuser-images.githubusercontent.com%2F6951139%2F206395107-e58a796d-13a9-400a-94b6-31cb5df054ab.png&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22other%22%2C%22productSlug%22%3A%22project%22%2C%22integrationSlug%22%3A%22sanity%22%7D%5D)


# Setup

Install the tagged prerelease:

```bash
pnpm install next-sanity@cache-components
```

```bash
npm install next-sanity@cache-components --save-exact
```

## 1. Configure `next.config.ts`

In your `next.config.ts`, enable `cacheComponents` and optionally add the sanity `cacheLife` preset:

```ts
// next.config.ts

import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    sanity, // makes `cacheLife('sanity')` available for your custom cached functions that won't be calling `sanityFetch` but should still have the same cache revalidation timing
  },
} satisfies NextConfig

export default nextConfig
```

## 2. Configure `defineLive`

Setup the `sanityFetch` and `SanityLive` exports same as in `next-sanity@12`.

You also need a `getDynamicFetchOptions()` helper that encapsulates the `draftMode()` and `cookies()` logic. This is called outside of `'use cache'` boundaries to resolve `perspective` and `stega`, which are then passed as props (and cache keys) to cached components:

```tsx
// src/sanity/lib/live.ts

import {createClient} from 'next-sanity'
import {defineLive, resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
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
})

// Resolves perspective and stega outside 'use cache' boundaries
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
```

## 3. Render `<SanityLive />` in the root `layout.tsx`:

<details>
<summary>When `cacheComponents: false` it's sufficient to render it with no props when `serverToken` and `browserToken` is set, handling draft events and published events are automatically handled:</summary>

```tsx
// src/app/layout.tsx

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '@/sanity/lib/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {(await draftMode()).isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
```

</details>

When `cacheComponents: true` you need to toggle this behavior yourself. The recommended pattern is to keep the dynamic `draftMode()` call in the root layout (which is not cached), and pass the dynamic parts as props to a separate `CachedLayout` component that has `'use cache'`:

```tsx
// src/app/layout.tsx

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '@/sanity/lib/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <CachedLayout
      live={<SanityLive key="live" includeAllDocuments={isDraftMode} />}
      visualEditing={isDraftMode && <VisualEditing key="visual-editing" />}
    >
      {children}
    </CachedLayout>
  )
}

async function CachedLayout({
  children,
  live,
  visualEditing,
}: {
  children: React.ReactNode
  live: React.ReactNode
  visualEditing: React.ReactNode
}) {
  'use cache'
  return (
    <html lang="en">
      <body>
        {children}
        {live}
        {visualEditing}
      </body>
    </html>
  )
}
```

This way the static shell (HTML structure) is cached, while the dynamic `draftMode()` result flows through as pre-rendered React node props.

## 4. Fetching data with `sanityFetch`

> [!IMPORTANT]
> [Read the intro on `'use cache'` and `'use cache: remote'` directives before you proceed.](https://nextjs.org/docs/app/getting-started/cache-components#using-use-cache)

Cache components introduce a layered caching system, and so you need to define cache boundaries yourself depending on your application's needs and how dynamic or cacheable the data you're fetching is.

### Key difference from `cacheComponents: false`

When `cacheComponents: false`, `sanityFetch` automatically reads `draftMode()` to set `perspective` and `stega` for you. When `cacheComponents: true`, Next.js **does not allow calling APIs like `draftMode()` within `'use cache'` boundaries**.

To handle this, the recommended pattern uses a three-layer component structure:

1. **Sync page component** -- renders `<Suspense>` with a loading fallback
2. **Dynamic component** -- calls `getDynamicFetchOptions()` to resolve `perspective` and `stega` outside the cache boundary, then passes them as props
3. **Cached component** -- has `'use cache'` and receives `perspective` and `stega` as props (which act as cache keys, so published and draft content get separate cache entries)

Under the hood `sanityFetch` will automatically call [the `cacheTag()` API](https://nextjs.org/docs/app/api-reference/functions/cacheTag) and [the `cacheLife()` API](https://nextjs.org/docs/app/api-reference/functions/cacheLife), so you can focus on simply defining your query and params and not worry about naming cache tags.

### Static routes

```tsx
// src/app/page.tsx

import {defineQuery} from 'next-sanity'
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {Suspense} from 'react'

const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current)][0...$limit]{_id,slug,title}`,
)

export default function Page() {
  return (
    <Suspense fallback={<section>Loading&hellip;</section>}>
      <DynamicProductsList />
    </Suspense>
  )
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

In Next.js 16+, `params` is a `Promise`. The dynamic layer unwraps both the params and the fetch options before passing them as plain, serializable values to the cached component:

```tsx
// src/app/product/[slug]/page.tsx

import {defineQuery} from 'next-sanity'
import {getDynamicFetchOptions, sanityFetch, type DynamicFetchOptions} from '@/sanity/lib/live'
import {Suspense} from 'react'

const PRODUCT_QUERY = defineQuery(
  `*[_type == "product" && slug.current == $slug][0]{_id,slug,title,description}`,
)

type Props = {
  params: Promise<{slug: string}>
}

export default function ProductPage({params}: Props) {
  return (
    <Suspense fallback={<section>Loading product&hellip;</section>}>
      <DynamicProductPage params={params} />
    </Suspense>
  )
}

async function DynamicProductPage({params}: Props) {
  const {slug} = await params
  const {perspective, stega} = await getDynamicFetchOptions()
  return <CachedProductPage slug={slug} perspective={perspective} stega={stega} />
}

async function CachedProductPage({slug, perspective, stega}: {slug: string} & DynamicFetchOptions) {
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

### Caching `generateMetadata`

You can also use `'use cache'` inside `generateMetadata`. Since metadata should always use published content without stega encoding, pass `perspective: 'published'` and `stega: false` explicitly:

```tsx
// src/app/product/[slug]/page.tsx

import type {Metadata, ResolvingMetadata} from 'next'

export async function generateMetadata(
  {params}: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  'use cache'
  const {slug} = await params
  const {data: product} = await sanityFetch({
    query: PRODUCT_QUERY,
    params: {slug},
    perspective: 'published',
    stega: false,
  })
  return {
    title: product?.title,
    description: product?.description ?? (await parent).description,
  }
}
```

