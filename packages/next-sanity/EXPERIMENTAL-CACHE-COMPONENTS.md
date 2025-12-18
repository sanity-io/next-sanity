> [!CAUTION]
> The experimental `next-sanity@cache-components` canary release is not yet stable and could have breaking changes in `minor`, and `patch`, releases.
> It requires `cacheComponents` to be enabled in your `next.config.ts`, which was introduced in [`next@16.0.0`](https://nextjs.org/blog/next-16#cache-components).

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

Setup the `sanityFetch` and `SanityLive` exports same as in `next-sanity@12`:

```tsx
// src/sanity/lib/live.ts

import {createClient} from 'next-sanity'
import {defineLive} from 'next-sanity/live'

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
```

## 3. Render `<SanityLive />` in the root `layout.tsx`:

<details>

<summary>

When `cacheComponents: false` it's sufficient to render it with no props when `serverToken` and `browserToken` is set, handling draft events and published events are automatically handled:

</summary>

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

When `cacheComponents: true` you need to toggle this behavior yourself:

```tsx
// src/app/layout.tsx

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '@/sanity/lib/live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  'use cache'
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive includeAllDocuments={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

## 4. Fetching data with `sanityFetch`

> [!IMPORTANT]
> [Read the intro on `'use cache'` and `'use cache: remote'` directives before you proceed.](https://nextjs.org/docs/app/getting-started/cache-components#using-use-cache)

Cache components introduce a layered caching system, and so you need to define cache boundaries yourself depending on your application's needs and how dynamic or cacheable the date you're fetching is.

### Baseline `cacheComponents: false` example

```tsx
// src/app/products.tsx

import {defineQuery} from 'next-sanity'
import {sanityFetch} from '@/sanity/lib/live'

const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current)][0...$limit]{_id,slug,title}`,
)

export default async function Page() {
  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params: {limit: 10},
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

This example looks simple, but it does a lot of magic under the hood.
Most importantly the `sanityFetch` call has two more options not seen here, `perspective` and `stega`.
`stega` is automatically set to `true` when `draftMode().isEnabled` is `true`, as long as `defineLive({stega: false})` isn't set.
The `perspective` param is automatically set to `'drafts'` when `draftMode().isEnabled` is `true`, or whatever value the `sanity-preview-perspective` cookie is set to by `next-sanity/draft-mode`'s `defineEnableDraftMode` API.

When `cacheComponents: true` we're no longer able to automatically set the `perspective` and `stega` options for you, as `next.js` **does not allow calling APIs like `draftMode()` within functions with `'use cache'` (or `'use cache: remote'`) directives**.

Thus when `cacheComponents: true` the `stega` option is `false` and you have to manually set it to `true`, and `perspective` is `published`.

Let's break it down step by step.

### `cacheComponents: true` without setting `perspective` or `stega`

This is basically the simplest way to use Sanity Live with `cacheComponents: true`, and doesn't look much different from the `cacheComponents: false`:

```tsx
// src/app/products.tsx

import {defineQuery} from 'next-sanity'
import {sanityFetch} from '@/sanity/lib/live'

const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current)][0...$limit]{_id,slug,title}`,
)

export default async function Page() {
  'use cache'

  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params: {limit: 10},
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

All we really did here was add `'use cache'` to `<Page />`. Under the hood `sanityFetch` will automatically call [the `cacheTag()` API ](https://nextjs.org/docs/app/api-reference/functions/cacheTag), as well as [the `cacheLife()` API ](https://nextjs.org/docs/app/api-reference/functions/cacheLife), so you can focus on simply defining your query and params and not worry about naming cache tags.

It only supports published content though, you won't be able to preview draft content in Presentation Tool and render overlays with stega when visually editing.

### Previewing draft content and rendering overlays with stega

Using `draftMode()` we can toggle between published and draft content, and when to embed stega for overlays, without much added complexity:

```tsx
// src/app/products.tsx

import {draftMode} from 'next/headers'
import {defineQuery} from 'next-sanity'
import {sanityFetch} from '@/sanity/lib/live'

const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current)][0...$limit]{_id,slug,title}`,
)

export default async function Page() {
  'use cache'

  const {isEnabled: isDraftMode} = await draftMode()
  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params: {limit: 10},
    perspective: isDraftMode ? 'drafts' : 'published',
    stega: isDraftMode,
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

Simple enough, right? But what if you want to preview content releases in Presentation Tool and not just toggle between published and draft content?

### Previewing Content Releases in Presentation Tool

Now we have to resolve the `sanity-preview-perspective` cookie to determine the perspective, and then set the `perspective` and `stega` options accordingly.
We still want the products list to be cached and part of the static shell in production, while also dynamically preview products in upcoming content releases.
To do so we need to have a cached component that renders in production and does not call `cookies()`, and a separate dynamic component for preview purposes that can call `cookies()`:

```tsx
// src/app/products.tsx

import {cookies, draftMode} from 'next/headers'
import {defineQuery} from 'next-sanity'
import {resolvePerspectiveFromCookies} from 'next-sanity/live'
import {Suspense} from 'react'
import {sanityFetch} from '@/sanity/lib/live'

const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current)][0...$limit]{_id,slug,title}`,
)

export default async function Page() {
  const {isEnabled: isDraftMode} = await draftMode()
  const params = {limit: 10}

  if (isDraftMode) {
    return (
      <Suspense fallback={<section>Loading&hellip;</section>}>
        <DynamicProductsList params={params} />
      </Suspense>
    )
  }

  return <CachedProductsList params={params} />
}

async function CachedProductsList({params}: {params: {limit: number}}) {
  'use cache'

  const {data: products} = await sanityFetch({query: PRODUCTS_QUERY, params})
  return <ProductsList products={products} />
}

async function DynamicProductsList({params}: {params: {limit: number}}) {
  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({cookies: jar})
  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params,
    stega: true,
    perspective,
  })
  return <ProductsList products={products} />
}

function ProductsList({products}: {products: {_id: string; slug: string; title: string}[]}) {
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

# Advanced example:

> [!CAUTION]
> This template is not up to date with the latest changes in `next-sanity@cache-components`

~~See the personal website template for a working example:

- [Code](https://github.com/sanity-io/template-nextjs-personal-website/tree/test-cache-components)
- [Demo](https://template-nextjs-personal-website-git-test-cache-components.sanity.dev/)~~
