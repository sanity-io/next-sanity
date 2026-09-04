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
  - [Metadata](#metadata)
- [Static params for dynamic routes](#static-params-for-dynamic-routes)
- [Invalidate the cache before live events reach the browser](#invalidate-the-cache-before-live-events-reach-the-browser)
  - [Setup](#setup)
  - [Check that it works](#check-that-it-works)
  - [Good to know](#good-to-know)
  - [Why the request is signed](#why-the-request-is-signed)
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
- `sanity` `^6.0.0` and `styled-components` `^6.1`, only if the same app embeds a Sanity Studio.

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

`next-sanity` no longer ships a `next-sanity/studio` entry point. To mount the Studio at a route in your Next.js app, install `sanity` and render its `Studio` component from a Client Component. `styled-components` is a peer dependency of both packages, so most package managers install it for you.

```bash
npm install sanity styled-components
```

The [Embedded Sanity Studio][embedded-studio] guide recommends a catch-all route whose segment matches `basePath` in `sanity.config.ts`:

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

If you relied on `history="hash"`, pass a hash history from the `history` package and load the Studio in the browser only. Static exports need this because they cannot serve a catch-all route:

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

`draftMode()` decides the defaults of `sanityFetch` and `<SanityLive />`, and `sanityFetch` reads it itself, which Next.js allows inside `'use cache'`. Outside draft mode a fetch is `perspective: 'published'` with `stega: false` and no variant, and `<SanityLive />` leaves `includeDrafts` off. Inside draft mode `stega` defaults to `true`, `<SanityLive />` includes drafts, and the perspective comes from the `perspective` resolver you hand `defineLive`. An explicit option always wins, so `stega: false` stays off inside draft mode and `perspective: 'drafts'` is honoured outside it.

Without a resolver the draft mode perspective comes from the Presentation Tool cookie when `cacheComponents` is off, and is `'drafts'` when it is on, because `cookies()` cannot be read inside `'use cache'`. With a resolver `sanityFetch` never reads cookies, so it behaves the same under either setting and nothing has to be threaded through props.

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

Apps that cannot add a `[perspective]` segment leave the resolver off. Inside draft mode with `cacheComponents` on the perspective is then `'drafts'`, so content release previews in Presentation Tool need the segment. The full pattern lives in the [`sanity-live-cache-components` skill][live-skill].

### Metadata

`defineLive` also returns `sanityFetchMetadata` for `generateMetadata`, `generateViewport`, and the file-based metadata routes. It is `sanityFetch` with `stega` fixed to `false`, so `data` keeps its clean TypeGen types, and it follows the same `perspective` rule. With Cache Components the library owns the `'use cache'` boundary, so no wrapper is needed:

```tsx
// app/[perspective]/[slug]/page.tsx
import type {Metadata} from 'next'

import {sanityFetchMetadata} from '@/sanity/live'

export async function generateMetadata({
  params,
}: PageProps<'/[perspective]/[slug]'>): Promise<Metadata> {
  const {slug} = await params
  const {data} = await sanityFetchMetadata({query: POST_QUERY, params: {slug}})
  return {title: data?.title}
}
```

Metadata routes such as `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` cannot read root params, so pass the perspective explicitly there:

```ts
// app/sitemap.ts
import type {MetadataRoute} from 'next'

import {sanityFetchMetadata} from '@/sanity/live'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {data} = await sanityFetchMetadata({query: POST_SLUGS_QUERY, perspective: 'published'})
  return data.map((post) => ({
    url: `https://example.com/${post.slug}`,
    lastModified: post._updatedAt,
  }))
}
```

## Static params for dynamic routes

`next-sanity/static-params` builds a [`generateStaticParams`][generate-static-params] from the page's own GROQ query. It is server and build-time only, so import it from route files and never from Client Components.

```tsx
// app/posts/[slug]/page.tsx
import {defineQuery} from 'next-sanity'
import {defineGenerateStaticParams, STATIC_PARAMS_PLACEHOLDER} from 'next-sanity/static-params'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/lib/client'

const postQuery = defineQuery(
  `*[_type == "post" && slug.current == $slug][0]{title, "slug": slug.current, publishedAt}`,
)

export const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})

export default async function Page({params}: PageProps<'/posts/[slug]'>) {
  const {slug} = await params
  if (slug === STATIC_PARAMS_PLACEHOLDER) notFound()
  const post = await client.fetch(postQuery, {slug})
  // render the post
}
```

When the route module loads, `groq-js` parses the query and reads the root `*[...]` filter. Each `<expression> == $param` conjunct names a route param and the expression that produces it. The other conjuncts stay as constraints. The `[0]`, slices, `order()`, and projection after the filter are dropped. The query above becomes `*[_type == "post" && defined(slug.current)]{"slug": slug.current}`. A syntax error, a `$param` that is not bound with `==`, or a query without bindings fails `next build` with the offending expression before any network request.

At build time the returned `generateStaticParams` does the following:

- Fetches with `perspective: 'published'`, `useCdn: true`, and stega and source maps off. Cookies are not available during `next build`, and param values are never rendered.
- Drops documents whose param value is `null`, empty, or of the wrong kind, and removes duplicates.
- Returns `[{slug: STATIC_PARAMS_PLACEHOLDER}]` when nothing remains. Cache Components fails the build when `generateStaticParams` returns `[]`, and the [Next.js error page][empty-generate-static-params] names this placeholder as the fallback. It also warns that a placeholder only validates the `notFound()` path, so the helper uses it only when the query returns nothing.
- Turns a binding into a constraint when the parent segment already provides the param. For `app/[category]/[slug]/page.tsx` with `*[_type == "post" && category->slug.current == $category && slug.current == $slug][0]`, Next.js calls `generateStaticParams({params: {category}})` and the result is `{slug}[]`.

Pass `order` and `limit` to prerender only the most recent documents, for example `order: '_updatedAt desc', limit: 100`.

A catch-all segment needs a `fallback`, because the query cannot tell `[slug]` from `[...slug]`. A `string[]` value declares the catch-all and types the result:

```ts
const docQuery = defineQuery(`*[_type == "doc" && string::split(slug.current, "/") == $path][0]`)

export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  query: docQuery,
  fallback: {path: [STATIC_PARAMS_PLACEHOLDER]},
})
```

The result type defaults to `Record<string, string>[]`. Next.js checks the returned params against the route at build time, so a type annotation is optional. Pass the shape as a generic when you want it, `defineGenerateStaticParams<{slug: string}>({client, query})`.

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

By default every browser tab connected through `<SanityLive>` receives a live event the moment published content changes. Each tab then calls a Server Action that expires the affected cache tags and refreshes the route, and the tabs race the revalidation. With [`<SanityLive waitFor="function">`][live-wait-for] Sanity instead runs a [sync tag invalidate function][sync-tag-function] first, holds the event until that function calls `done()`, and only then lets browsers refresh. The function expires the cache once, before any tab renders, so the first refresh shows fresh content.

`next-sanity` ships both halves. `defineInvalidateSyncTags` from `next-sanity/live/invalidate` is the route handler that verifies a signed request and expires the tags. `defineInvalidateSyncTagsHandler` from the companion package [`@sanity/next-sanity-functions`][next-sanity-functions] signs and sends that request from the function.

### Setup

You need admin access to the Sanity project and to the environment variables of the host that runs your Next.js app. Every step below runs in the Next.js project root.

**1. Generate a secret.** The site and the function share it.

```shell
openssl rand -hex 32
```

**2. Add the route handler.**

```ts
// app/api/revalidate/route.ts
import {defineInvalidateSyncTags} from 'next-sanity/live/invalidate'

export const {POST} = defineInvalidateSyncTags({secret: process.env.SANITY_REVALIDATE_SECRET})
```

It responds `503` while the secret is unset, `401` to a missing, invalid, or stale signature, `400` to a malformed body, and `200` with the expired tags. Pass `profile: 'max'` to serve stale content while revalidating instead of expiring immediately.

**3. Add the function.** Install `@sanity/next-sanity-functions`, `@sanity/functions`, and `@sanity/blueprints`, then create the handler.

```ts
// functions/invalidate-sync-tags/index.ts
import {defineInvalidateSyncTagsHandler} from '@sanity/next-sanity-functions'

export const handler = defineInvalidateSyncTagsHandler({
  secret: process.env.SANITY_REVALIDATE_SECRET,
  urls: process.env.REVALIDATE_URL,
})
```

`urls` splits a string on commas, so one `REVALIDATE_URL` can name several deployments that read the same dataset.

**4. Add the blueprint.** It scopes the function to your dataset and sets the function's environment variables at deploy time.

```ts
// sanity.blueprint.ts
import {loadEnvConfig} from '@next/env'
import {defineBlueprint, defineSyncTagInvalidateFunction} from '@sanity/blueprints'

loadEnvConfig(__dirname, process.env.NODE_ENV !== 'production', {
  info: () => null,
  error: console.error,
})

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET,
  REVALIDATE_URL,
  SANITY_REVALIDATE_SECRET,
} = process.env

// Blueprint `env` is additive, so leaving a value out keeps whatever is already deployed.
const env: Record<string, string> = {}
if (REVALIDATE_URL) env.REVALIDATE_URL = REVALIDATE_URL
if (SANITY_REVALIDATE_SECRET) env.SANITY_REVALIDATE_SECRET = SANITY_REVALIDATE_SECRET

export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: 'invalidate-sync-tags',
      event: {
        resource: {
          type: 'dataset',
          id: `${NEXT_PUBLIC_SANITY_PROJECT_ID}.${NEXT_PUBLIC_SANITY_DATASET}`,
        },
      },
      env: Object.keys(env).length > 0 ? env : undefined,
    }),
  ],
})
```

**5. Wire `waitFor`.** Render `<SanityLive waitFor="function" />` only where the function is deployed. An environment variable read at build time keeps local development and previews on the default behavior.

```tsx
<SanityLive
  waitFor={process.env.SANITY_LIVE_WAIT_FOR_FUNCTION === 'true' ? 'function' : undefined}
/>
```

**6. Set the variables on the host.** On the deployment that serves the site, set `SANITY_REVALIDATE_SECRET` to the secret from step 1 and `SANITY_LIVE_WAIT_FOR_FUNCTION` to `true`. Do not redeploy yet.

**7. Deploy the function.** From your machine, with `REVALIDATE_URL=https://<your-site>/api/revalidate` and the same `SANITY_REVALIDATE_SECRET` in `.env.local`:

```shell
npx sanity login
npx sanity blueprints init . --project-id <project-id> --stack-name <dataset>
npx sanity blueprints deploy
```

`init` runs once and writes `.sanity/blueprint.config.json`, which you add to `.gitignore` so every clone binds to its own stack. The log of `deploy` ends with `[Functions] Created 1 function`.

To deploy from CI instead, use the official [Blueprints GitHub Actions][blueprints-action]. Run `sanity-io/blueprints-actions/plan@plan-v2` on pull requests and `sanity-io/blueprints-actions/deploy@deploy-v3` on the default branch. Give both jobs `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `REVALIDATE_URL`, and `SANITY_REVALIDATE_SECRET`, plus a deploy token from `npx sanity blueprints mint-deploy-token --print` and the stack id from `npx sanity blueprints info`. Gate both jobs on a `SANITY_BLUEPRINT_STACK_ID` repository variable so forks without a stack skip them.

**8. Redeploy the site** so the variables from step 6 apply.

### Check that it works

- `npx sanity functions env list invalidate-sync-tags` lists `REVALIDATE_URL` and `SANITY_REVALIDATE_SECRET`.
- Open the site with the browser console open. The Sanity Live welcome message ends with "Events will be delayed until after a Sanity Function has processed them."
- Publish a change. The page updates on its first refresh, and `npx sanity functions logs invalidate-sync-tags` shows `Invalidated N sync tags at https://<your-site>/api/revalidate, HTTP 200`.

To run the function against a local dev server without deploying anything:

```shell
REVALIDATE_URL=http://localhost:3000/api/revalidate SANITY_REVALIDATE_SECRET=<secret> \
  npx sanity functions test invalidate-sync-tags --data '{"syncTags": ["s1:example"]}'
```

### Good to know

- One sync tag invalidate function exists per dataset. The blueprint scopes it to `NEXT_PUBLIC_SANITY_PROJECT_ID.NEXT_PUBLIC_SANITY_DATASET`, and a second deploy fails with "a sync tag invalidation subscription already exists".
- `SANITY_LIVE_WAIT_FOR_FUNCTION` is read at build time, so a change needs a redeploy.
- Leave `SANITY_LIVE_WAIT_FOR_FUNCTION` unset for local development and for preview deployments the function cannot reach. Those origins gain nothing from the wait, and when no function is deployed at all the events never arrive.
- Draft Mode ignores `waitFor`. `includeDrafts` wins and the browser refreshes on every event.
- The route rejects signatures older than five minutes. Change the window with `maxAge`.
- Blueprint `env` is additive. A deploy that leaves a key out keeps the deployed value, and a deploy that sets it overwrites it.

### Why the request is signed

The function signs the request body with [`@sanity/webhook`][sanity-webhook], the same HMAC scheme Sanity uses for GROQ-powered webhooks. The signature covers the body and the time it was created, so a captured request cannot be edited or replayed after `maxAge`. A bearer token would be a static credential sent in the clear on every call, and any log line that captures it is enough to expire your cache at will. That is why `defineInvalidateSyncTags` accepts only signed requests. A project coming from a hand-rolled bearer token setup, like the [personal website template][sanity-next-featured-starter], swaps its function body for `defineInvalidateSyncTagsHandler` and drops the token.

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
[empty-generate-static-params]: https://nextjs.org/docs/messages/empty-generate-static-params
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
[sanity-webhook]: https://github.com/sanity-io/webhook-toolkit#readme
[blueprints-action]: https://www.sanity.io/docs/blueprints/blueprint-action
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
