# next-sanity<!-- omit in toc -->

The all-in-one [Sanity][sanity] toolkit for production-grade content-editable Next.js applications.

**Features:**

- [Sanity Client][sanity-client] for queries and mutations, fully compatible with the [Next.js cache][next-cache]
- [Visual Editing][visual-editing] for interactive live preview of draft content
- [Embedded Sanity Studio][sanity-studio], a deeply-configurable content editing dashboard
- [GROQ][groq-syntax-highlighting] for powerful content querying with type generation and syntax highlighting
- [Portable Text][portable-text] for rendering rich text and block content

**Quicklinks**: [Sanity docs][sanity-docs] | [Next.js docs][next-docs] | [Clean starter template][sanity-next-clean-starter] | [Fully-featured starter template][sanity-next-featured-starter]

## Table of contents<!-- omit in toc -->

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Manual installation](#manual-installation)
  - [Install `next-sanity`](#install-next-sanity)
  - [Optional: peer dependencies for embedded Sanity Studio](#optional-peer-dependencies-for-embedded-sanity-studio)
  - [Manual configuration](#manual-configuration)
  - [Write GROQ queries](#write-groq-queries)
  - [Generate TypeScript Types](#generate-typescript-types)
  - [Using query result types](#using-query-result-types)
- [Query content from Sanity Content Lake](#query-content-from-sanity-content-lake)
  - [Configuring Sanity Client](#configuring-sanity-client)
  - [Fetching in App Router Components](#fetching-in-app-router-components)
  - [Fetching in Page Router Components](#fetching-in-page-router-components)
  - [Should `useCdn` be `true` or `false`?](#should-usecdn-be-true-or-false)
  - [How does `apiVersion` work?](#how-does-apiversionwork)
- [Caching and revalidation](#caching-and-revalidation)
  - [`sanityFetch()` helper function](#sanityfetch-helper-function)
  - [Time-based revalidation](#time-based-revalidation)
  - [Path-based revalidation](#path-based-revalidation)
  - [Tag-based revalidation](#tag-based-revalidation)
  - [Debugging caching and revalidation](#debugging-caching-and-revalidation)
  - [Example implementation](#example-implementation)
- [Visual Editing](#visual-editing)
- [Live Content API](#live-content-api)
  - [Setup](#setup)
  - [How does it revalidate and refresh in real time](#how-does-it-revalidate-and-refresh-in-real-time)
- [Embedded Sanity Studio](#embedded-sanity-studio)
  - [Creating a Studio route](#creating-a-studio-route)
  - [Automatic installation of embedded Studio](#automatic-installation-of-embedded-studio)
  - [Manual installation of embedded Studio](#manual-installation-of-embedded-studio)
  - [Studio route with App Router](#studio-route-with-app-router)
  - [Lower-level control with `StudioProvider` and `StudioLayout`](#lower-level-control-with-studioprovider-and-studiolayout)
- [Migration guides](#migration-guides)
- [License](#license)

## Installation

## Quick Start

Instantly create a new free Sanity project – or link to an existing one – from the command line and connect it to your Next.js application by the following terminal command _in your Next.js project folder_:

```bash
npx sanity@latest init
```

If you do not yet have a Sanity account you will be prompted to create one. This command will create basic utilities required to query content from Sanity. And optionally embed Sanity Studio - a configurable content management system - at a route in your Next.js application. See the [Embedded Sanity Studio](#embedded-sanity-studio) section.

## Manual installation

If you do not yet have a Next.js application, you can create one with the following command:

```bash
npx create-next-app@latest
```

This README assumes you have chosen all of the default options, but should be fairly similar for most bootstrapped Next.js projects.

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

### Optional: peer dependencies for embedded Sanity Studio

When using `npm` newer than `v7`, or `pnpm` newer than `v8`, you should end up with needed dependencies like `sanity` and `styled-components` when you installed `next-sanity`. In `yarn` `v1` you can use `install-peerdeps`:

```bash
npx install-peerdeps --yarn next-sanity
```

### Manual configuration

The `npx sanity@latest init` command offers to write some configuration files for your Next.js application. Most importantly is one that writes your chosen Sanity project ID and dataset name to your local environment variables. Note that unlike access tokens, the project ID and dataset name are **not** considered sensitive information.

**Create** this file at the root of your Next.js application if it does not already exist.

```bash
# .env.local

NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=<your-dataset-name>
```

**Create** a file to access and export these values

```ts
// ./src/sanity/env.ts

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!

// Values you may additionally want to configure globally
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-07-11'
```

Remember to add these environment variables to your hosting provider's environment as well.

### Write GROQ queries

`next-sanity` exports the `defineQuery` function which will give you syntax highlighting in [VS Code with the Sanity extension installed][vs-code-extension]. It’s also used for GROQ query result type generation with [Sanity TypeGen][sanity-typegen].

```ts
// ./src/sanity/lib/queries.ts

import {defineQuery} from 'next-sanity'

export const POSTS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)][0...12]{
  _id, title, slug
}`)

export const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  title, body, mainImage
}`)
```

### Generate TypeScript Types

You can use [Sanity TypeGen to generate TypeScript types][sanity-typegen] for your schema types and GROQ query results in your Next.js application. It should be readily available if you have used `sanity init` and chosen the embedded Studio.

> [!TIP]
> Sanity TypeGen will [create Types for queries][sanity-typegen-queries] that are assigned to a variable and use the `groq` template literal or `defineQuery` function.

If your Sanity Studio schema types are in a different project or repository, you can [configure Sanity TypeGen to write types to your Next.js project][sanity-typegen-monorepo].

**Create** a `sanity-typegen.json` file at the root of your project to configure Sanity TypeGen:

```json
// sanity-typegen.json
{
  "path": "./src/**/*.{ts,tsx,js,jsx}",
  "schema": "./src/sanity/extract.json",
  "generates": "./src/sanity/types.ts"
}
```

Note: This configuration is strongly opinionated that the generated Types and the schema extraction are both within the `/src/sanity` directory, not the root which is the default. This configuration is complimented by setting the path of the schema extraction in the updated package.json scripts below.

**Run** the following command in your terminal to extract your Sanity Studio schema to a JSON file

```bash
# Run this each time your schema types change
npx sanity@latest schema extract
```

**Run** the following command in your terminal to generate TypeScript types for both your Sanity Studio schema and GROQ queries

```bash
# Run this each time your schema types or GROQ queries change
npx sanity@latest typegen generate
```

**Update** your Next.js project's `package.json` to perform both of these commands by running `npm run typegen`

```json
"scripts": {
  "predev": "npm run typegen",
  "dev": "next",
  "prebuild": "npm run typegen",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typegen": "sanity schema extract --path=src/sanity/extract.json && sanity typegen generate"
},
```

### Using query result types

Sanity TypeGen creates TypeScript types for the results of your GROQ queries, which _can_ be used as generics like this:

```ts
import {client} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'
import {POSTS_QUERYResult} from '@/sanity/types'

const posts = await client.fetch<POSTS_QUERYResult>(POSTS_QUERY)
//    ^? const post: POST_QUERYResult
```

However, it is much simpler to use automatic type inference. So long as your GROQ queries are wrapped in `defineQuery`, the results should be inferred automatically:

```ts
import {client} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'

const posts = await client.fetch(POSTS_QUERY)
//    ^? const post: POST_QUERYResult
```

## Query content from Sanity Content Lake

Sanity content is typically queried with GROQ queries from a configured Sanity Client. [Sanity also supports GraphQL][sanity-graphql].

### Configuring Sanity Client

To interact with Sanity content in a Next.js application, we recommend creating a `client.ts` file:

```ts
// ./src/sanity/lib/client.ts
import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})
```

### Fetching in App Router Components

To fetch data in a React Server Component using the [App Router][app-router] you can await results from the Sanity Client inside a server component:

```tsx
// ./src/app/page.tsx

import {client} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'

export default async function PostIndex() {
  const posts = await client.fetch(POSTS_QUERY)

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={`/posts/${post?.slug.current}`}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### Fetching in Page Router Components

If you're using the [Pages Router][pages-router] you can await results from Sanity Client inside a `getStaticProps` function:

```tsx
// ./src/pages/index.tsx

import {client} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'

export async function getStaticProps() {
  const posts = await client.fetch(POSTS_QUERY)

  return {posts}
}

export default async function PostIndex({posts}) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={`/posts/${post?.slug.current}`}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### Should `useCdn` be `true` or `false`?

You might notice that you have to set the `useCdn` to `true` or `false` in the client configuration. Sanity offers [caching on a CDN for queries][cdn]. Since Next.js has its own caching, using the Sanity CDN might not be necessary, but there are some exceptions.

In general, set `useCdn` to `true` when:

- Data fetching happens client-side, for example, in a `useEffect` hook or in response to a user interaction where the `client.fetch` call is made in the browser.
- Server-side rendered (SSR) data fetching is dynamic and has a high number of unique requests per visitor, for example, a "For You" feed.

Set `useCdn` to `false` when:

- Used in a static site generation context, for example, `getStaticProps` or `getStaticPaths`.
- Used in an ISR on-demand webhook responder.
- Good `stale-while-revalidate` caching is in place that keeps API requests on a consistent low, even if traffic to Next.js spikes.
- For Preview or Draft modes as part of an editorial workflow, you need to ensure that the latest content is always fetched.

### How does `apiVersion` work?

Sanity uses [date-based API versioning][api-versioning]. You can configure the date in a `YYYY-MM-DD` format, and it will automatically fall back on the latest API version of that time. Then, if a breaking change is introduced later, it won't break your application and give you time to test before upgrading.

## Caching and revalidation

This toolkit includes the [`@sanity/client`][sanity-client] which fully supports Next.js `fetch` based features for caching and revalidation. This ensures great performance while preventing stale content in a way that's native to Next.js.

> [!NOTE]
> Some hosts (like Vercel) will keep the content cache in a dedicated data layer and not part of the static app bundle, which means re-deploying the app will not purge the cache. We recommend reading up on [caching behavior in the Next.js docs][next-cache].

### `sanityFetch()` helper function

It can be beneficial to set revalidation defaults for all queries. In all of the following examples, a `sanityFetch()` helper function is used for this purpose.

While this function is written to accept _both_ Next.js caching options `revalidate` and `tags`, your application should only rely on one. For this reason, if `tags` are supplied, the `revalidate` setting will be set to `false` (cache indefinitely) and you will need to bust the cache for these pages using [`revalidateTag()`](#tag-based-revalidation).

In short:

- Time-based `revalidate` is good enough for most applications.
  - Any page can be automatically purged from the cache using [`revalidatePath()`](#path-based-revalidation).
- Content-based `tags` will give you more fine-grained control for complex applications.
  - Pages cached by tags must be purged using [`revalidateTag()`](#tag-based-revalidation).

```ts
// ./src/sanity/lib/client.ts

import {createClient, type QueryParams} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})

export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  revalidate = 60, // default revalidation time in seconds
  tags = [],
}: {
  query: QueryString
  params?: QueryParams
  revalidate?: number | false
  tags?: string[]
}) {
  return client.fetch(query, params, {
    next: {
      revalidate: tags.length ? false : revalidate, // for simple, time-based revalidation
      tags, // for tag-based revalidation
    },
  })
}
```

Be aware that you can get errors if you use `cache` and `revalidate` configurations for Next.js together. See the [Next.js documentation on revalidation][next-revalidate-docs].

### Time-based revalidation

Time-based revalidation is often good enough for the majority of applications.

Increase the `revalidate` setting for longer-lived and less frequently modified content.

```tsx
// ./src/app/pages/index.tsx

import {sanityFetch} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'

export default async function PostIndex() {
  const posts = await sanityFetch({
    query: POSTS_QUERY,
    revalidate: 3600, // update cache at most once every hour
  })

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={`/posts/${post?.slug.current}`}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### Path-based revalidation

For on-demand revalidation of individual pages, Next.js has a `revalidatePath()` function. You can create an API route in your Next.js application to execute it, and [a GROQ-powered webhook][groq-webhook] in your Sanity Project to instantly request it when content is created, updated or deleted.

**Create** a new environment variable `SANITY_REVALIDATE_SECRET` with a random string that is shared between your Sanity project and your Next.js application. This is considered sensitive and should not be committed to your repository.

```bash
# .env.local

SANITY_REVALIDATE_SECRET=<some-random-string>
```

**Create** a new API route in your Next.js application

The code example below uses the built-in `parseBody` function to validate that the request comes from your Sanity project (using a shared secret and looking at the request headers). Then it looks at the document type information in the webhook payload and matches that against the revalidation tags in your application

```ts
// ./src/app/api/revalidate-path/route.ts

import {revalidatePath} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

type WebhookPayload = {path?: string}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_REVALIDATE_SECRET) {
      return new Response('Missing environment variable SANITY_REVALIDATE_SECRET', {status: 500})
    }

    const {isValidSignature, body} = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    )

    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(JSON.stringify({message, isValidSignature, body}), {status: 401})
    } else if (!body?.path) {
      const message = 'Bad Request'
      return new Response(JSON.stringify({message, body}), {status: 400})
    }

    revalidatePath(body.path)
    const message = `Updated route: ${body.path}`
    return NextResponse.json({body, message})
  } catch (err) {
    console.error(err)
    return new Response(err.message, {status: 500})
  }
}
```

**Create** a new GROQ-powered webhook in your Sanity project.

You can [copy this template][webhook-template-revalidate-path] to quickly add the webhook to your Sanity project.

The Projection uses [GROQ's `select()` function][groq-functions] to dynamically create paths for nested routes like `/posts/[slug]`, you can extend this example your routes and other document types.

```groq
{
  "path": select(
    _type == "post" => "/posts/" + slug.current,
    "/" + slug.current
  )
}
```

> [!TIP]
> If you wish to revalidate _all routes_ on demand, create an API route that calls `revalidatePath('/', 'layout')`

### Tag-based revalidation

Tag-based revalidation is preferable for instances where many pages are affected by a single document being created, updated or deleted.

For on-demand revalidation of many pages, Next.js has a `revalidateTag()` function. You can create an API route in your Next.js application to execute it, and [a GROQ-powered webhook][groq-webhook] in your Sanity Project to instantly request it when content is created, updated or deleted.

```tsx
// ./src/app/pages/index.tsx

import {sanityFetch} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'

export default async function PostIndex() {
  const posts = await sanityFetch({
    query: POSTS_QUERY,
    tags: ['post', 'author'], // revalidate all pages with the tags 'post' and 'author'
  })

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={`/posts/${post?.slug.current}`}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

**Create** a new environment variable `SANITY_REVALIDATE_SECRET` with a random string that is shared between your Sanity project and your Next.js application. This is considered sensitive and should not be committed to your repository.

```bash
# .env.local

SANITY_REVALIDATE_SECRET=<some-random-string>
```

**Create** a new API route in your Next.js application

The code example below uses the built-in `parseBody` function to validate that the request comes from your Sanity project (using a shared secret and looking at the request headers). Then it looks at the document type information in the webhook payload and matches that against the revalidation tags in your application

```ts
// ./src/app/api/revalidate-tag/route.ts

import {revalidateTag} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

type WebhookPayload = {
  _type: string
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_REVALIDATE_SECRET) {
      return new Response('Missing environment variable SANITY_REVALIDATE_SECRET', {status: 500})
    }

    const {isValidSignature, body} = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    )

    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(JSON.stringify({message, isValidSignature, body}), {status: 401})
    } else if (!body?._type) {
      const message = 'Bad Request'
      return new Response(JSON.stringify({message, body}), {status: 400})
    }

    // If the `_type` is `post`, then all `client.fetch` calls with
    // `{next: {tags: ['post']}}` will be revalidated
    revalidateTag(body._type)

    return NextResponse.json({body})
  } catch (err) {
    console.error(err)
    return new Response(err.message, {status: 500})
  }
}
```

**Create** a new GROQ-powered webhook in your Sanity project.

You can [copy this template][webhook-template-revalidate-tag] to quickly add the webhook to your Sanity project.

### Debugging caching and revalidation

To aid in debugging and understanding what's in the cache, revalidated, skipped, and more, add the following to your Next.js configuration file:

```js
// ./next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

### Example implementation

Check out the [Personal website template][personal-website-template] to see a feature-complete example of how `revalidateTag` is used together with Visual Editing.

## Visual Editing

Interactive live previews of draft content are the best way for authors to find and edit content with the least amount of effort and the most confidence to press publish.

> [!TIP]
> Visual Editing is available on all Sanity plans and can be enabled on all hosting environments.

> [!NOTE]
> Vercel ["Content Link"][vercel-content-link] adds an "edit" button to the Vercel toolbar on preview builds and is available on Vercel Pro and Enterprise plans.

An end-to-end tutorial of [how to configure Sanity and Next.js for Visual Editing](https://www.sanity.io/guides/nextjs-app-router-live-preview) using the same patterns demonstrated in this README is available on the Sanity Exchange.

## Live Content API

[The Live Content API][live-content-api] can be used to receive real time updates in your application when viewing both draft content in contexts like Presentation tool, and published content in your user-facing production application.

> [!NOTE]
> The Live Content API is currently considered experimental and may change in the future.

### Setup

#### 1. Configure `defineLive`

Use `defineLive` to enable automatic revalidation and refreshing of your fetched content.

```tsx
// src/sanity/lib/live.ts

import {createClient, defineLive} from 'next-sanity'

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

The `token` passed to `defineLive` needs [Viewer rights](https://www.sanity.io/docs/roles#e2daad192df9) in order to fetch draft content.

The same token can be used as both `browserToken` and `serverToken`, as the `browserToken` is only shared with the browser when Draft Mode is enabled. Draft Mode can only be initiated by either Sanity's Presentation Tool or the Vercel Toolbar.

> Good to know:
> Enterprise plans allow the creation of custom roles with more resticted access rights than the `Viewer` role, enabling the use of a `browserToken` specifically for authenticating the Live Content API. We're working to extend this capability to all Sanity price plans.

#### 2. Render `<SanityLive />` in the root `layout.tsx`

```tsx
// src/app/layout.tsx

import {VisualEditing} from 'next-sanity'
import {SanityLive} from '@/sanity/lib/live'

export default function RootLayout({children}: {children: React.ReactNode}) {
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

The `<SanityLive>` component is responsible for making all `sanityFetch` calls in your application _live_, so should always be rendered. This differs from the `<VisualEditing />` component, which should only be rendered when Draft Mode is enabled.

#### 3. Fetching data with `sanityFetch`

Use `sanityFetch` to fetch data in any server component.

```tsx
// src/app/products.tsx

import {defineQuery} from 'next-sanity'
import {sanityFetch} from '@/sanity/lib/live'

const PRODUCTS_QUERY = defineQuery(`*[_type == "product" && defined(slug.current)][0...$limit]`)

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

### Using `generateMetadata`, `generateStaticParams` and more

`sanityFetch` can also be used in functions like `generateMetadata` in order to make updating the page title, or even its favicon, _live_.

```ts
import {sanityFetch} from '@/sanity/lib/live'
import type {Metadata} from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const {data} = await sanityFetch({
    query: SETTINGS_QUERY,
    // Metadata should never contain stega
    stega: false,
  })
  return {
    title: {
      template: `%s | ${data.title}`,
      default: data.title,
    },
  }
}
```

> Good to know:
> Always set `stega: false` when calling `sanityFetch` within these:
>
> - `generateMetadata`
> - `generateViewport`
> - `generateSitemaps`
> - `generateImageMetadata`

```ts
import {sanityFetch} from '@/sanity/lib/live'

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: POST_SLUGS_QUERY,
    // Use the published perspective in generateStaticParams
    perspective: 'published',
    stega: false,
  })
  return data
}
```

### 4. Integrating with Next.js Draft Mode and Vercel Toolbar's Edit Mode

To support previewing draft content when Draft Mode is enabled, the `serverToken` passed to `defineLive` should be assigned the Viewer role, which has the ability to fetch content using the `drafts` perspective.

Click the Draft Mode button in the Vercel toolbar to enable draft content:

![image](https://github.com/user-attachments/assets/5aa3ed30-929e-48f1-a16c-8246309ec099)

With drafts enabled, you'll see the Edit Mode button show up if your Vercel plan is eligible:

![img](https://github.com/user-attachments/assets/6ca7a9f5-e2d1-4915-83d0-8928a0a563de)

Ensure that `browserToken` is setup if you want draft content that isn't yet published to also update live.

### 5. Integrating with Sanity Presentation Tool & Visual Editing

The `defineLive` API also supports Presentation Tool and Sanity Visual Editing.

Setup an API route that uses `defineEnableDraftMode` in your app:

```ts
// src/app/api/draft-mode/enable/route.ts

import {client} from '@/sanity/lib/client'
import {token} from '@/sanity/lib/token'
import {defineEnableDraftMode} from 'next-sanity/draft-mode'

export const {GET} = defineEnableDraftMode({
  client: client.withConfig({token}),
})
```

The main benefit of `defineEnableDraftMode` is that it fully implements all of Sanity Presentation Tool's features, including the perspective switcher:

<img width="530" alt="image" src="https://github.com/user-attachments/assets/774d8f92-527f-4478-8089-2fb7e6a5c618">

And the Preview URL Sharing feature:

<img width="450" alt="image" src="https://github.com/user-attachments/assets/d11b38eb-389b-448f-862c-b39b3adbb7e3">

In your `sanity.config.ts`, set the `previewMode.enable` option for `presentationTool`:

```ts
// sanity.config.ts
'use client'

import {defineConfig} from 'sanity'
import {presentationTool} from 'next-sanity'

export default defineConfig({
  // ...
  plugins: [
    // ...
    presentationTool({
      previewUrl: {
        // ...
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
  ],
})
```

Ensuring you have a valid viewer token setup for `defineLive.serverToken` and `defineEnableDraftMode` allows Presentation Tool to auto enable Draft Mode, and your application to pull in draft content that refreshes in real time.

The `defineLive.browserToken` option isn't required, but is recommended as it enables a faster live preview experience, both standalone and when using Presentation Tool.

### 6. Enabling standalone live preview of draft content

Standalone live preview has the following requirements:

- `defineLive.serverToken` must be defined, otherwise only published content is fetched.
- At least one integration (Sanity Presentation Tool or Vercel Toolbar) must be setup, so Draft Mode can be enabled in your application on demand.
- `defineLive.browserToken` must be defined with a valid token.

You can verify if live preview is enabled with the `useIsLivePreview` hook:

```tsx
'use client'

import {useIsLivePreview} from 'next-sanity/hooks'

export function DebugLivePreview() {
  const isLivePreview = useIsLivePreview()
  if (isLivePreview === null) return 'Checking Live Preview...'
  return isLivePreview ? 'Live Preview Enabled' : 'Live Preview Disabled'
}
```

The following hooks can also be used to provide information about the application's current environment:

```ts
import {
  useIsPresentationTool,
  useDraftModeEnvironment,
  useDraftModePerspective,
} from 'next-sanity/hooks'
```

### Handling Layout Shift

Live components will re-render automatically as content changes. This can cause jarring layout shifts in production when items appear or disappear from a list.

To provide a better user experience, we can animate these layout changes. The following example uses `framer-motion@12.0.0-alpha.1`, which supports React Server Components:

```tsx
// src/app/products.tsx

import {AnimatePresence} from 'framer-motion'
import * as motion from 'framer-motion/client'
import {defineQuery} from 'next-sanity'
import {sanityFetch} from '@/sanity/lib/live'

const PRODUCTS_QUERY = defineQuery(`*[_type == "product" && defined(slug.current)][0...$limit]`)

export default async function Page() {
  const {data: products} = await sanityFetch({
    query: PRODUCTS_QUERY,
    params: {limit: 10},
  })

  return (
    <section>
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <motion.article
            key={product._id}
            layout="position"
            animate={{opacity: 1}}
            exit={{opacity: 0}}
          >
            <a href={`/product/${product.slug}`}>{product.title}</a>
          </motion.article>
        ))}
      </AnimatePresence>
    </section>
  )
}
```

Whilst this is an improvement, it may still lead to users attempting to click on an item as it shifts position, potentially resulting in the selection of an unintended item. We can instead require users to opt-in to changes before a layout update is triggered.

To preserve the ability to render everything on the server, we can make use of a Client Component wrapper. This can defer showing changes to the user until they've explicitly clicked to "Refresh". The example below uses `sonner` to provide toast functionality:

```tsx
// src/app/products/products-layout-shift.tsx

'use client'

import {useCallback, useState, useEffect} from 'react'
import isEqual from 'react-fast-compare'
import {toast} from 'sonner'

export function ProductsLayoutShift(props: {children: React.ReactNode; ids: string[]}) {
  const [children, pending, startViewTransition] = useDeferredLayoutShift(props.children, props.ids)

  /**
   * We need to suspend layout shift for user opt-in.
   */
  useEffect(() => {
    if (!pending) return

    toast('Products have been updated', {
      action: {
        label: 'Refresh',
        onClick: () => startViewTransition(),
      },
    })
  }, [pending, startViewTransition])

  return children
}

function useDeferredLayoutShift(children: React.ReactNode, dependencies: unknown[]) {
  const [pending, setPending] = useState(false)
  const [currentChildren, setCurrentChildren] = useState(children)
  const [currentDependencies, setCurrentDependencies] = useState(dependencies)

  if (!pending) {
    if (isEqual(currentDependencies, dependencies)) {
      if (currentChildren !== children) {
        setCurrentChildren(children)
      }
    } else {
      setCurrentDependencies(dependencies)
      setPending(true)
    }
  }

  const startViewTransition = useCallback(() => {
    setCurrentDependencies(dependencies)
    setPending(false)
  }, [dependencies])

  return [pending ? currentChildren : children, pending, startViewTransition] as const
}
```

This Client Component is used to wrap the layout that should only be updated after the user has clicked the refresh button:

```diff
// src/app/products/page.tsx

import { AnimatePresence } from "framer-motion";
import * as motion from "framer-motion/client";
import {defineQuery} from 'next-sanity'
import { sanityFetch } from "@/sanity/lib/live";
+import {ProductsLayoutShift} from './products-page-layout-shift.tsx'

const PRODUCTS_QUERY = defineQuery(`*[_type == "product" && defined(slug.current)][0...$limit]`)

export default async function Page() {
  const {data: products} = await sanityFetch({ query: PRODUCTS_QUERY, params: {limit: 10} });
+  // If the list over ids change, it'll trigger the toast asking the user to opt-in to refresh
+  // but if a product title has changed, perhaps to fix a typo, we update that right away
+  const ids = products.map((product) => product._id)
  return (
    <section>
+     <ProductsLayoutShift ids={ids}>
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.article
              key={product._id}
              layout="position"
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <a href={`/product/${product.slug}`}>{product.title}</a>
            </motion.article>
          ))}
        </AnimatePresence>
+     </ProductsLayoutShift>
    </section>
  );
}
```

With this approach we've limited the use of client components to just a single component. All the server components within `<ProductsLayoutShift>` remain as server components, with all their benefits.

## How does the Live Content API revalidate and refresh in real-time?

The architecture for `defineLive` works as follows:

1. `sanityFetch` automatically sets `fetch.next.tags` for you using opaque tags generated by our backend, prefixed with `sanity:`.
2. `<SanityLive />` listens to change events using the Sanity Live Content API (LCAPI).
3. When the LCAPI emits an event, `<SanityLive />` invokes a Server Function that calls `revalidateTag(`sanity:${tag}`)`.
4. Since it's a Server Function, Next.js will evict data fetches associated with the revalidated tag. The page is seamlessly updated with fresh content, which future visitors will also see thanks to `revalidateTag` integrating with ISR.

With this setup, as long as one visitor accesses your Next.js app after a content change, the cache is updated globally for all users, regardless of the specific URL they visit.

### Revalidating content changes from automations

If your content operations involve scenarios where you might not always have a visitor to trigger the `revalidateTag` event, there are two ways to ensure your content is never stale:

#### A) Use a GROQ powered webhook to call `revalidateTag(sanity)`

All queries made using `sanityFetch` include the `sanity` tag in their `fetch.next.tags` array. You can use this to call `revalidateTag('sanity')` in an API route that handles a GROQ webhook payload.

This approach can be considered a "heavy hammer" so it's important to limit the webhook events that trigger it. You could also implement this in a custom component to manually purge the cache if content gets stuck.

#### B) Setup a server-side `<SanityLive />` alternative

You can setup your own long-running server, using Express for example, to listen for change events using the Sanity Live Content API. Then, create an API route in your Next.js app:

```ts
// src/app/api/revalidate-tag/route.ts
import {revalidateTag} from 'next/cache'

export const POST = async (request) => {
  const {tags, isValid} = await validateRequest(request)
  if (!isValid) return new Response('No no no', {status: 400})
  for (const _tag of tags) {
    const tag = `sanity:${_tag}`
    revalidateTag(tag)
    // eslint-disable-next-line no-console
    console.log(`revalidated tag: ${tag}`)
  }
}
```

Your Express app can then forward change events to this endpoint, ensuring your content is always up-to-date. This method guarantees that stale content is never served, even if no browser is actively viewing your app!

## Embedded Sanity Studio

Sanity Studio is a near-infinitely configurable content editing interface that can be embedded into any React application. For Next.js, you can embed the Studio on a route (like `/studio`). The Studio will still require authentication and be available only for members of your Sanity project.

This opens up many possibilities including dynamic configuration of your Sanity Studio based on a network request or user input.

> [!WARNING]
> The convenience of co-locating the Studio with your Next.js application is appealing, but it can also influence your content model to be too website-centric, and potentially make collaboration with other developers more difficult. Consider a standalone or monorepo Studio repository for larger projects and teams.

### Creating a Studio route

`next-sanity` exports a `<NextStudio />` component to load Sanity's `<Studio />` component wrapped in a Next.js friendly layout. `metadata` specifies the necessary `<meta>` tags for making the Studio adapt to mobile devices and prevents the route from being indexed by search engines.

### Automatic installation of embedded Studio

To quickly connect an existing - or create a new - Sanity project to your Next.js application, run the following command in your terminal. You will be prompted to create a route for the Studio during setup.

```bash
npx sanity@latest init
```

### Manual installation of embedded Studio

**Create** a file `sanity.config.ts` in the project's root and copy the example below:

```ts
// ./sanity.config.ts
'use client'

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  basePath: '/studio', // `basePath` must match the route of your Studio
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {types: []},
})
```

Optionally, **create** a `sanity.cli.ts` with the same `projectId` and `dataset` as your `sanity.config.ts` to the project root so that you can run `npx sanity <command>` from the terminal inside your Next.js application:

```ts
// ./sanity.cli.ts

import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineCliConfig({api: {projectId, dataset}})
```

Now you can run commands like `npx sanity cors add`. Run `npx sanity help` for a full list of what you can do.

### Studio route with App Router

Even if the rest of your app is using Pages Router, you can and should mount the Studio on an App Router route. [Next.js supports both routers in the same app.](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#migrating-from-pages-to-app)

**Create** a new route to render the Studio, with the default metadata and viewport configuration:

```tsx
// ./src/app/studio/[[...tool]]/page.tsx

import {NextStudio} from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'

export {metadata, viewport} from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

The default meta tags exported by `next-sanity` can be customized if necessary:

```tsx
// ./src/app/studio/[[...tool]]/page.tsx

import type {Metadata, Viewport} from 'next'
import {metadata as studioMetadata, viewport as studioViewport} from 'next-sanity/studio'

// Set the correct `viewport`, `robots` and `referrer` meta tags
export const metadata: Metadata = {
  ...studioMetadata,
  // Overrides the title until the Studio is loaded
  title: 'Loading Studio...',
}

export const viewport: Viewport = {
  ...studioViewport,
  // Overrides the viewport to resize behavior
  interactiveWidget: 'resizes-content',
}

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

### Lower-level control with `StudioProvider` and `StudioLayout`

If you need even more control over the Studio, you can pass `StudioProvider` and `StudioLayout` from `sanity` as `children`:

```tsx
// ./src/app/studio/[[...tool]]/page.tsx

'use client'

import {NextStudio} from 'next-sanity/studio'
import {StudioProvider, StudioLayout} from 'sanity'

import config from '../../../sanity.config'

function StudioPage() {
  return (
    <NextStudio config={config}>
      <StudioProvider config={config}>
        {/* Put components here and you'll have access to the same React hooks as Studio gives you when writing plugins */}
        <StudioLayout />
      </StudioProvider>
    </NextStudio>
  )
}
```

## Migration guides

> [!IMPORTANT]
> You're looking at the README for v9, the README for [v8 is available here](https://github.com/sanity-io/next-sanity/tree/v8?tab=readme-ov-file#next-sanity) as well as an [migration guide][migrate-v8-to-v9].

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

[api-versioning]: https://www.sanity.io/docs/api-versioning?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[app-router]: https://nextjs.org/docs/app/building-your-application/routing
[cdn]: https://www.sanity.io/docs/asset-cdn?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[groq-syntax-highlighting]: https://marketplace.visualstudio.com/items?itemName=sanity-io.vscode-sanity
[groq-webhook]: https://www.sanity.io/docs/webhooks?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[image-url]: https://www.sanity.io/docs/presenting-images?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[LICENSE]: LICENSE
[migrate-v1-to-v4]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v1-to-v4.md
[migrate-v4-to-v5-app]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v4-to-v5-app-router.md
[migrate-v4-to-v5-pages]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v4-to-v5-pages-router.md
[migrate-v5-to-v6]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v5-to-v6.md
[migrate-v6-to-v7]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v6-to-v7.md
[migrate-v7-to-v8]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v7-to-v8.md
[migrate-v8-to-v9]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v8-to-v9.md
[next-cache]: https://nextjs.org/docs/app/building-your-application/caching
[next-docs]: https://nextjs.org/docs
[next-revalidate-docs]: https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate
[pages-router]: https://nextjs.org/docs/pages/building-your-application/routing
[personal-website-template]: https://github.com/sanity-io/template-nextjs-personal-website
[portable-text]: https://portabletext.org
[sanity-client]: https://www.sanity.io/docs/js-client?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity]: https://www.sanity.io?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[visual-editing]: https://www.sanity.io/docs/introduction-to-visual-editing?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[webhook-template-revalidate-tag]: https://www.sanity.io/manage/webhooks/share?name=Tag-based+Revalidation+Hook+for+Next.js+13+&description=1.+Replace+URL+with+the+preview+or+production+URL+for+your+revalidation+handler+in+your+Next.js+app%0A2.%C2%A0Insert%2Freplace+the+document+types+you+want+to+be+able+to+make+tags+for+in+the+Filter+array%0A3.%C2%A0Make+a+Secret+that+you+also+add+to+your+app%27s+environment+variables+%28SANITY_REVALIDATE_SECRET%29%0A%0AFor+complete+instructions%2C+see+the+README+on%3A%0Ahttps%3A%2F%2Fgithub.com%2Fsanity-io%2Fnext-sanity&url=https%3A%2F%2FYOUR-PRODUCTION-URL.TLD%2Fapi%2Frevalidate-tag&on=create&on=update&on=delete&filter=_type+in+%5B%22post%22%2C+%22home%22%2C+%22OTHER_DOCUMENT_TYPE%22%5D&projection=%7B_type%7D&httpMethod=POST&apiVersion=v2021-03-25&includeDrafts=&headers=%7B%7D
[webhook-template-revalidate-path]: https://www.sanity.io/manage/webhooks/share?name=Path-based+Revalidation+Hook+for+Next.js&description=1.+Replace+URL+with+the+preview+or+production+URL+for+your+revalidation+handler+in+your+Next.js+app%0A2.%C2%A0Insert%2Freplace+the+document+types+you+want+to+be+able+to+make+tags+for+in+the+Filter+array%0A3.%C2%A0Make+a+Secret+that+you+also+add+to+your+app%27s+environment+variables+%28SANITY_REVALIDATE_SECRET%29%0A%0AFor+complete+instructions%2C+see+the+README+on%3A%0Ahttps%3A%2F%2Fgithub.com%2Fsanity-io%2Fnext-sanity&url=https%3A%2F%2FYOUR-PRODUCTION-URL.TLD%2Fapi%2Frevalidate-path&on=create&on=update&on=delete&filter=_type+in+%5B%22post%22%2C+%22home%22%2C+%22OTHER_DOCUMENT_TYPES%22%5D&projection=%7B%0A++%22path%22%3A+select%28%0A++++_type+%3D%3D+%22post%22+%3D%3E+%22%2Fposts%2F%22+%2B+slug.current%2C%0A++++slug.current%0A++%29%0A%7D&httpMethod=POST&apiVersion=v2021-03-25&includeDrafts=&headers=%7B%7D
[sanity-typegen]: https://www.sanity.io/docs/sanity-typegen?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-typegen-monorepo]: https://www.sanity.io/docs/sanity-typegen#1a6a147d6737?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-typegen-queries]: https://www.sanity.io/docs/sanity-typegen#c3ef15d8ad39?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-docs]: https://www.sanity.io/docs
[sanity-graphql]: https://www.sanity.io/docs/graphql?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[vs-code-extension]: https://marketplace.visualstudio.com/items?itemName=sanity-io.vscode-sanity
[sanity-studio]: https://www.sanity.io/docs/sanity-studio?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[groq-functions]: https://www.sanity.io/docs/groq-functions?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[vercel-content-link]: https://vercel.com/docs/workflow-collaboration/edit-mode#content-link?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-next-clean-starter]: https://www.sanity.io/templates/nextjs-sanity-clean
[sanity-next-featured-starter]: https://www.sanity.io/templates/personal-website-with-built-in-content-editing
[live-content-api]: https://www.sanity.io/docs/live-content-api?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
