# next-sanity<!-- omit in toc -->

The all-in-one [Sanity][sanity] toolkit for production-grade content-editable Next.js applications.

- [Next.js + Sanity quick start][sanity-next-quickstart]: Get a working Next.js + Sanity project running in minutes, from creating a Sanity project to querying your first content.
- [`next-sanity` overview][next-sanity-intro]: Explore everything the `next-sanity` package has to offer.
- [Configure the next-sanity client][sanity-next-client]: Set up the Sanity client with environment variables, CDN caching, and per-request overrides for different fetching contexts.
- [Query with GROQ][next-queries]: Make type safe queries with GROQ using the included Sanity client.
- [Visual editing and live preview][app-router-vised]: Enable click-to-edit overlays and real-time content updates in the Presentation Tool using Draft Mode, `defineLive`, and the `<VisualEditing />` component.
- [Caching and revalidation][sanity-next-caching]: Control content freshness with time-based, tag-based, and path-based revalidation strategies for applications that need fine-grained cache management.
- [Reference documentation][sanity-reference-docs]: Browse the full `next-sanity` API reference for detailed type signatures and configuration options.

**Quicklinks**: [Sanity docs][sanity-next-docs] | [Next.js docs][next-docs] | [Clean starter template][sanity-next-clean-starter] | [Fully-featured starter template][sanity-next-featured-starter]

## Table of contents<!-- omit in toc -->

- [Quick Start](#quick-start)
- [Manual installation](#manual-installation)
  - [Requirements](#requirements)
  - [Install `next-sanity`](#install-next-sanity)
  - [Optional: embed Sanity Studio yourself](#optional-embed-sanity-studio-yourself)
- [Sanity Live with Cache Components](#sanity-live-with-cache-components)
- [Static params for dynamic routes](#static-params-for-dynamic-routes)
- [Invalidate the cache before live events reach the browser](#invalidate-the-cache-before-live-events-reach-the-browser)
- [Migration guides](#migration-guides)
- [License](#license)

## Quick Start

Instantly create a new free Sanity project – or link to an existing one – from the command line and connect it to your Next.js application by the following terminal command _in your Next.js project folder_:

```bash
npx sanity@latest init
```

If you do not yet have a Sanity account you will be prompted to create one. This command will create the basic utilities required to query content from Sanity, and optionally embed Sanity Studio — a configurable content management system — at a route in your Next.js application. See the [Embedded Sanity Studio][embedded-studio] guide.

## Manual installation

If you do not yet have a Next.js application, you can create one with the following command:

```bash
npx create-next-app@latest
```

This README assumes you have chosen all of the default options, but should be fairly similar for most bootstrapped Next.js projects.

### Requirements

`next-sanity` v14 requires:

- Node.js `>=22.12`, the same range as `sanity` and `@sanity/client`.
- Next.js `^16.3.0`.
- React and React DOM `^19.2.3`.
- `@sanity/client` `^8.0.0`. `next-sanity` re-exports `createClient` from it.
- `sanity` `^6.0.0` and `styled-components` `^6.1`, only if you embed Sanity Studio with `next-sanity/studio`.

Run `npm view next-sanity engines peerDependencies` to read the exact ranges of the published version.

### Install `next-sanity`

Inside your Next.js application, run the following command in the package manager of your choice to install the next-sanity toolkit:

```bash
npm install next-sanity @sanity/image-url
```

```bash
yarn add next-sanity @sanity/image-url
```

```bash
pnpm install next-sanity @sanity/image-url
```

```bash
bun install next-sanity @sanity/image-url
```

This also installs `@sanity/image-url` for [On-Demand Image Transformations][image-url] to render images from Sanity's CDN.

### Optional: embed Sanity Studio yourself

`next-sanity` no longer ships a `next-sanity/studio` entry point. To mount the Studio at a route in your Next.js app, install `sanity` and render its `Studio` component from a Client Component. `styled-components` is a peer dependency of both `sanity` and `next-sanity`, so most package managers install it for you.

```bash
npm install sanity styled-components
```

The [Embedded Sanity Studio][embedded-studio] guide covers the recommended setup, a catch-all route that matches `basePath` in `sanity.config.ts`:

```tsx
// app/studio/[[...tool]]/page.tsx
'use client'

import {Studio} from 'sanity'

import config from '@/sanity.config'

export default function StudioPage() {
  return <Studio config={config} />
}
```

The former `metadata` and `viewport` exports were two small objects. Declare them in the route or its layout:

```tsx
// app/studio/[[...tool]]/layout.tsx
import type {Metadata, Viewport} from 'next'

export const metadata: Metadata = {referrer: 'same-origin', robots: 'noindex'}
export const viewport: Viewport = {width: 'device-width', initialScale: 1, viewportFit: 'cover'}

export default function StudioLayout({children}: {children: React.ReactNode}) {
  return children
}
```

If you relied on `history="hash"`, for example because your app is a static export, pass a hash history from the `history` package and load the Studio in the browser only:

```tsx
// app/studio/Studio.tsx
'use client'

import {createHashHistory} from 'history'
import {Studio} from 'sanity'

import config from '@/sanity.config'

const history = createHashHistory()

export default function StudioClient() {
  return <Studio config={config} unstable_history={history} unstable_globalStyles />
}
```

```tsx
// app/studio/page.tsx
'use client'

import dynamic from 'next/dynamic'

const Studio = dynamic(() => import('./Studio'), {ssr: false})

export default function StudioPage() {
  return <Studio />
}
```

## Sanity Live with Cache Components

With `cacheComponents: true`, `defineLive({strict: true})` makes draft mode the single source of truth. `sanityFetch` reads `draftMode()` itself, which Next.js allows inside `'use cache'`. Outside draft mode every fetch is forced to `perspective: 'published'` with `stega: false`. Inside draft mode `stega` defaults to `true` and the perspective comes from the `perspective` resolver you hand `defineLive`, or from the call site when there is no resolver. `<SanityLive />` derives `includeDrafts` from `draftMode()` the same way. Cookies are never read, so nothing has to be threaded through props.

The resolver is usually the `[perspective]` root param getter from `next/root-params`, with `definePerspectiveProxy` from `next-sanity/live/proxy` rewriting every request into the `/[perspective]/...` route tree based on the draft mode cookies:

```ts
// sanity/live.ts
import {defineLive} from 'next-sanity/live'
import {perspective} from 'next/root-params'

import {client} from './client'

const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
  perspective,
})
```

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

```tsx
// app/[perspective]/layout.tsx
import {SanityLive} from '@/sanity/live'

export function generateStaticParams() {
  return [{perspective: 'published'}]
}

export default function RootLayout({children}: LayoutProps<'/[perspective]'>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
```

```tsx
// app/[perspective]/[slug]/page.tsx
import {defineQuery} from 'next-sanity'
import {Suspense} from 'react'

import {sanityFetch} from '@/sanity/live'

const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]`)

export default function Page({params}: PageProps<'/[perspective]/[slug]'>) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {params.then(({slug}) => (
        <CachedPost slug={slug} />
      ))}
    </Suspense>
  )
}

async function CachedPost({slug}: {slug: string}) {
  'use cache'
  const {data} = await sanityFetch({query: POST_QUERY, params: {slug}})
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

Without a `perspective` resolver, `sanityFetch` requires `perspective` on every call, both in the types and at runtime. The value only applies inside draft mode. The full pattern, including apps that cannot add a `[perspective]` segment, lives in the [`sanity-live-cache-components` skill][live-skill].

## Static params for dynamic routes

`next-sanity/static-params` builds a [`generateStaticParams`][generate-static-params] from a GROQ filter and one GROQ expression per route param. It is server and build-time only, so import it from route files and never from Client Components.

```tsx
// app/posts/[slug]/page.tsx
import {defineGenerateStaticParams} from 'next-sanity/static-params'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/lib/client'

export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  filter: '_type == "post" && defined(slug.current)',
  params: {slug: 'slug.current'},
  fallback: {slug: '__placeholder__'},
  order: '_updatedAt desc',
  limit: 100,
})

export default async function Page({params}: PageProps<'/posts/[slug]'>) {
  const {slug} = await params
  if (slug === '__placeholder__') notFound()
  // fetch and render the post
}
```

What it does for you:

- Assembles `*[<filter>] | order(<order>)[0...<limit>]{"slug": slug.current}` and parses the filter, every param expression, and the assembled query with `groq-js` when the module loads. A syntax error fails `next build` immediately and names the expression and its position.
- Fetches with `perspective: 'published'`, `useCdn: true`, and stega and source maps off. Cookies are not available during `next build`, and param values are never rendered.
- Drops documents whose param value is `null` or of the wrong kind, removes duplicates, and returns `[fallback]` when nothing remains. Cache Components fails the build when `generateStaticParams` returns `[]`, so the fallback is required. Handle it in the page with `notFound()`.
- Types the result from `fallback`. A `string` value declares a `[slug]` segment and a `string[]` value declares a `[...slug]` or `[[...slug]]` segment, for example `params: {path: 'string::split(slug.current, "/")'}` with `fallback: {path: ['__placeholder__']}`.
- Forwards the parent segment's params to GROQ, so `app/[category]/[slug]/page.tsx` can use `filter: '_type == "post" && category->slug.current == $category'`.

A root param that needs a constant value, such as `app/[perspective]/layout.tsx`, does not need the helper. Return the constant directly:

```ts
export function generateStaticParams() {
  return [{perspective: 'published'}]
}
```

When you write the query yourself, `ensureStaticParams` applies the same fallback rule:

```ts
import {ensureStaticParams} from 'next-sanity/static-params'

export async function generateStaticParams() {
  return ensureStaticParams(await getArticleStaticParams(), {article: '_', section: '_'})
}
```

The returned `query` string is the assembled GROQ. Pass it to `sanityFetch` from `next-sanity/live` with `perspective: 'published'` and `stega: false` when you want the fetch to carry cache tags.

## Invalidate the cache before live events reach the browser

By default every browser tab connected through `<SanityLive>` receives a live event the moment published content changes, and each tab calls a Server Action that expires the affected cache tags and refreshes the route. With [`<SanityLive waitFor="function">`][live-wait-for] Sanity instead invokes a [sync tag invalidate function][sync-tag-function] first, holds the event until that function calls `done()`, and only then lets browsers refresh. The cache is expired once, before anyone renders.

`next-sanity` ships both halves. The route handler verifies a signed request and expires the tags; the companion package [`@sanity/next-sanity-functions`][next-sanity-functions] signs and sends it from the function.

1. Pick a shared secret, for example `openssl rand -hex 32`, and set it as `SANITY_REVALIDATE_SECRET` on your Next.js deployment.

2. Add the route handler:

   ```ts
   // app/api/revalidate/route.ts
   import {defineInvalidateSyncTags} from 'next-sanity/live/invalidate'

   export const {POST} = defineInvalidateSyncTags({secret: process.env.SANITY_REVALIDATE_SECRET})
   ```

   It responds `503` while the secret is unset, `401` to a missing, invalid, or stale signature (older than five minutes by default, configurable with `maxAge`), `400` to a malformed body, and `200` with the expired tags. Pass `profile: 'max'` to serve stale content while revalidating instead of expiring immediately.

3. Declare and implement the function, then deploy it with `npx sanity blueprints deploy`:

   ```ts
   // sanity.blueprint.ts
   import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

   export default defineBlueprint({
     resources: [
       defineSyncTagInvalidateFunction({
         name: 'invalidate-sync-tags',
         event: {resource: {type: 'dataset', id: `${projectId}.${dataset}`}},
       }),
     ],
   })
   ```

   ```ts
   // functions/invalidate-sync-tags/index.ts
   import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

   export const handler = defineInvalidateSyncTagsHandler({
     secret: process.env.SANITY_REVALIDATE_SECRET,
     urls: process.env.REVALIDATE_URLS,
   })
   ```

   ```bash
   npx sanity functions env add invalidate-sync-tags SANITY_REVALIDATE_SECRET <the same secret>
   npx sanity functions env add invalidate-sync-tags REVALIDATE_URLS https://<your-site>/api/revalidate
   ```

   `REVALIDATE_URLS` takes a comma separated list when several deployments read the same dataset.

Once the function is deployed, render `<SanityLive waitFor="function" />`. Until then leave `waitFor` unset, since Sanity would hold every event for a function that never calls `done()`. Draft Mode is unaffected either way, `includeDrafts` takes precedence.

## Migration guides

- [From `v12` to `v13`][migrate-v12-to-v13]
- [From `v11` to `v12`][migrate-v11-to-v12]
- [From `v10` to `v11`][migrate-v10-to-v11]
- [From `v9` to `v10`][migrate-v9-to-v10]
- [From `v8` to `v9`][migrate-v8-to-v9]
- [From `v7` to `v8`][migrate-v7-to-v8]
- [From `v6` to `v7`][migrate-v6-to-v7]
- [From `v5` to `v6`][migrate-v5-to-v6]
- From `v4` to `v5`
  - [`app-router`][migrate-v4-to-v5-app]
  - [`pages-router`][migrate-v4-to-v5-pages]
- [From `<0.4` to `v4`][migrate-v1-to-v4]

## License

MIT-licensed. See [LICENSE][LICENSE].

[embedded-studio]: https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs
[generate-static-params]: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
[LICENSE]: LICENSE
[live-skill]: https://github.com/sanity-io/next-sanity/tree/main/skills/sanity-live-cache-components
[migrate-v1-to-v4]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v1-to-v4.md
[migrate-v4-to-v5-app]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v4-to-v5-app-router.md
[migrate-v4-to-v5-pages]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v4-to-v5-pages-router.md
[migrate-v5-to-v6]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v5-to-v6.md
[migrate-v6-to-v7]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v6-to-v7.md
[migrate-v7-to-v8]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v7-to-v8.md
[migrate-v8-to-v9]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v8-to-v9.md
[migrate-v9-to-v10]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v9-to-v10.md
[migrate-v10-to-v11]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v10-to-v11.md
[migrate-v11-to-v12]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v11-to-v12.md
[migrate-v12-to-v13]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md
[next-docs]: https://nextjs.org/docs
[next-sanity-functions]: https://github.com/sanity-io/next-sanity/tree/main/packages/next-sanity-functions#readme
[live-wait-for]: https://reference.sanity.io/next-sanity/
[sync-tag-function]: https://www.sanity.io/docs/functions/sync-tag-function-quickstart
[sanity]: https://www.sanity.io?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-next-clean-starter]: https://www.sanity.io/templates/nextjs-sanity-clean
[sanity-next-featured-starter]: https://www.sanity.io/templates/personal-website-with-built-in-content-editing
[sanity-next-quickstart]: https://www.sanity.io/docs/next-js-quickstart/setting-up-your-studio
[sanity-next-docs]: https://www.sanity.io/docs/nextjs
[sanity-next-client]: https://www.sanity.io/docs/nextjs/configure-sanity-client-nextjs
[app-router-vised]: https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router
[sanity-reference-docs]: https://reference.sanity.io/next-sanity/
[sanity-next-caching]: https://www.sanity.io/docs/nextjs/caching-and-revalidation-in-nextjs
[next-queries]: https://www.sanity.io/docs/nextjs/query-content-nextjs
[next-sanity-intro]: https://www.sanity.io/docs/nextjs/introduction
