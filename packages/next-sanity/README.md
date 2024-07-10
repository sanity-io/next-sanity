# next-sanity<!-- omit in toc -->

The all-in-one [Sanity.io][sanity] toolkit for production-grade content-editable Next.js applications.

**Features:**

- [Sanity Client][sanity-client] for queries and mutations, fully compatible with the [Next.js cache][next-cache]
- [Embedded Sanity Studio][sanity-studio], the configurable, open-source Content Management System
- [Visual Editing](#visual-editing-with-content-source-maps) for interactive live previews
- [GROQ query syntax highlighting][groq-syntax-highlighting]
- [Portable Text][portable-text] for rendering rich text and block content

## Table of contents<!-- omit in toc -->

- [Installation](#installation)
  - [Common dependencies](#common-dependencies)
  - [Peer dependencies for embedded Sanity Studio](#peer-dependencies-for-embedded-sanity-studio)
- [Quick Start](#quick-start)
  - [Generating TypeScript Types](#generating-typescript-types)
- [Query Sanity Content](#query-sanity-content)
  - [Writing GROQ queries](#writing-groq-queries)
  - [Configuring Sanity Client](#configuring-sanity-client)
  - [Fetching in App Router Components](#fetching-in-app-router-components)
  - [Fetching in Page Router Components](#fetching-in-page-router-components)
  - [Should `useCdn` be `true` or `false`?](#should-usecdn-be-true-or-false)
  - [How does `apiVersion` work?](#how-does-apiversionwork)
- [Cache revalidation](#cache-revalidation)
  - [`sanityFetch()` helper function](#sanityfetch-helper-function)
  - [Using `cache` and `revalidation` at the same time](#using-cache-and-revalidation-at-the-same-time)
  - [Time-based revalidation](#time-based-revalidation)
  - [Path-based revalidation](#path-based-revalidation)
  - [Tag-based revalidation](#tag-based-revalidation)
  - [Example implementation](#example-implementation)
  - [Debugging caching and revalidation](#debugging-caching-and-revalidation)
- [Visual editing](#visual-editing)
  - [Configuring Sanity Client and `sanityFetch()` for Visual Editing](#configuring-sanity-client-and-sanityfetch-for-visual-editing)
  - [Using `draftMode()` to toggle Visual Editing](#using-draftmode-to-toggle-visual-editing)
  - [Using Presentation for secure Visual Editing](#using-presentation-for-secure-visual-editing)
- [Enhanced Visual Editing with React Loader](#enhanced-visual-editing-with-react-loader)
- [Embedded Sanity Studio](#embedded-sanity-studio)
  - [Creating a Studio route](#creating-a-studio-route)
  - [Automatic installation](#automatic-installation)
  - [Manual installation](#manual-installation)
  - [Studio route with App Router](#studio-route-with-app-router)
  - [Lower level control with `StudioProvider` and `StudioLayout`](#lower-level-control-with-studioprovider-and-studiolayout)
- [Migration guides](#migration-guides)
- [License](#license)

## Installation

For basic functionality, run the following command in the package manager of your choice:

```bash
npm install next-sanity
```

```bash
yarn add next-sanity
```

```bash
pnpm install next-sanity
```

```bash
bun install next-sanity
```

### Common dependencies

Building with Sanity and Next.js, you're likely to want libraries to handle [On-Demand Image Transformations][image-url] and [Visual Editing](https://www.sanity.io/docs/loaders-and-overlays):

```bash
npm install @sanity/image-url @sanity/react-loader
```

```bash
yarn add @sanity/image-url @sanity/react-loader
```

```bash
pnpm install @sanity/image-url @sanity/react-loader
```

```bash
bun install @sanity/image-url @sanity/react-loader
```

### Peer dependencies for embedded Sanity Studio

When using `npm` newer than `v7`, or `pnpm` newer than `v8`, you should end up with needed dependencies like `sanity` and `styled-components` when you `npm install next-sanity`. It also works in `yarn` `v1` using `install-peerdeps`:

```bash
npx install-peerdeps --yarn next-sanity
```

## Quick Start

Instantly create a new free Sanity project - or link to an existing one - from the command line and connect it to your Next.js Application with the following terminal command:

```bash
npx sanity@latest init
```

If you do not yet have a Sanity account you will be prompted to create one. This command will create the utilities you require to query content from Sanity. As well as embed a configurable content management system - Sanity Studio - into your Next.js app.

### Generating TypeScript Types

If you have an embedded Studio with schema types in the same project as your Next.js app, use [Sanity TypeGen to generate TypeScript types][sanity-typegen] for your schema types and GROQ queries.

```bash
# Run this each time your schema types change
npx sanity@latest schema extract
```

```bash
# Run this each time your schema types or GROQ queries change
npx sanity@latest typegen generate
```

You should now have a `sanity.types.ts` file at the root of your project.

If your Sanity Studio schema types are in a different project or repository, you can [configure Sanity TypeGen to write types to your Next.js project][sanity-typegen-monorepo].

## Query Sanity Content

Sanity content is typically queried with GROQ queries from a configured Sanity Client. [Sanity also supports GraphQL][sanity-graphql].

### Writing GROQ queries

`next-sanity` exports the `groq` template literal which will give you syntax highlighting in [VS Code with the Sanity extension installed][vs-code-extension].

Sanity TypeGen will [create Types for queries][sanity-typegen-queries] assigned to a variable that use `groq`.

```ts
// ./src/sanity/lib/queries.ts

export const POSTS_QUERY = groq`*[_type == "post" && defined(slug.current)][0...12]{
  _id, title, slug
}`

export const POST_QUERY = groq`*[_type == "post" && slug.current == $slug][0]{
  title, body
}`
```

### Configuring Sanity Client

To perform GROQ queries with `next-sanity`, we recommend creating a `client.ts` file:

```ts
// ./src/sanity/lib/client.ts
import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-06-01'

export const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // Set to true if statically generating pages, using ISR or time-based revalidation
})
```

### Fetching in App Router Components

To fetch data in a React Server Component using the [App Router][app-router] you can await results from Sanity client inside a server component:

```tsx
// ./src/app/page.tsx

import {client} from '@/sanity/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'
import {POSTS_QUERYResult} from '../../../sanity.types'

export async function PostIndex() {
  const posts = await client.fetch<POSTS_QUERYResult>(POSTS_QUERY)

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={post?.slug.current}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### Fetching in Page Router Components

If you're using the [Pages Router][pages-router] you can await results from Sanity client inside a `getStaticProps` function:

```tsx
// ./src/pages/index.tsx

import {client} from '@/sanity/lib/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'
import {POSTS_QUERYResult} from '../../../sanity.types'

export async function getStaticProps() {
  const posts = await client.fetch<POSTS_QUERYResult>(POSTS_QUERY)

  return {posts}
}

export async function PostIndex({posts}) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={post?.slug.current}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### Should `useCdn` be `true` or `false`?

You might notice that you have to set the `useCdn` to `true` or `false` in the client configuration. Sanity offers [caching on a CDN for content queries][cdn]. Since Next.js often comes with caching, it might not be necessary, but there are some exceptions.

The general rule is that `useCdn` should be `true` when:

- Data fetching happens client-side, for example, in a `useEffect` hook or in response to a user interaction where the `client.fetch` call is made in the browser.
- Server-side rendered (SSR) data fetching is dynamic and has a high number of unique requests per visitor, for example, a "For You" feed.

And it makes sense to set `useCdn` to `false` when:

- Used in a static site generation context, for example, `getStaticProps` or `getStaticPaths`.
- Used in an ISR on-demand webhook responder.
- Good `stale-while-revalidate` caching is in place that keeps API requests on a consistent low, even if traffic to Next.js spikes.
- For Preview or Draft modes as part of an editorial workflow, you need to ensure that the latest content is always fetched.

### How does `apiVersion` work?

Sanity uses [date-based API versioning][api-versioning]. You can configure the date in a `YYYY-MM-DD` format, and it will automatically fall back on the latest API version of that time. Then, if a breaking change is introduced later, it won't break your application and give you time to test before upgrading.

## Cache revalidation

This toolkit includes the [`@sanity/client`][sanity-client] that fully supports Next.js `fetch` based features for caching and revalidation. It‘s _not necessary_ to use the `React.cache` method like with many other third-party SDKs. This gives you tools to ensure great performance while preventing stale content in a way that's native to Next.js.

> [!NOTE]
> Some hosts (like Vercel) will keep the content cache in a dedicated data layer and not part of the static app bundle, which means that it might not be revalidated by re-deploying the app. We recommend reading up on [caching behavior in the Next.js docs][next-cache].

### `sanityFetch()` helper function

It can be beneficial to set revalidation defaults for all queries. In all of the following examples, a `sanityFetch()` helper function is used for this purpose.

While this function is written to support _both_ Next.js caching options `revalidate` and `tags`, your app should only rely on one. Time-based `revalidate` is good enough for most applications. Tags will give you more fine-grained control.

```ts
// ./src/sanity/lib/client.ts

import 'server-only'

import {createClient, type QueryParams} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

export const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // set to false if using `tag` based revalidation
})

export async function sanityFetch<QueryResponse>({
  query,
  params = {},
  revalidate = 60, // default revalidation time in seconds
  tags = [],
}: {
  query: string
  params?: QueryParams
  revalidate?: number | boolean
  tags?: string[]
}) {
  return client.fetch<QueryResponse>(query, params, {
    next: {
      revalidate, // for simple, time-based revalidation
      tags, // for tag-based revalidation
    },
  })
}
```

### Using `cache` and `revalidation` at the same time

Be aware that you can get errors if you use the `cache` and the `revalidate` configurations for Next.js cache at the same time. Go to [the Next.js docs][next-revalidate-docs] to learn more.

### Time-based revalidation

Time-based revalidation is often good enough for the majority of applications. It's simple to set up and can be configured on a per-query basis.

Increase the revalidate number for longer-lived and less frequently modified content.

```tsx
// ./src/app/pages/index.tsx

import {client} from '@/sanity/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'
import {POSTS_QUERYResult} from '../../../sanity.types'

export async function PostIndex() {
  const posts = await sanityFetch<POSTS_QUERYResult>({
    query: POSTS_QUERY,
    revalidate: 3600, // update cache at most once every hour
  })

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={post?.slug.current}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### Path-based revalidation

For on-demand revalidation of individual pages, Next.js has a `revalidatePath()` function. You can create an API route in your Next.js application to execute it, and [a GROQ-powered webhook][groq-webhook] in your Sanity Project to instantly request it when content is created, updated or deleted.

**Create** a new environment variable `SANITY_REVALIDATE_SECRET` with a random string that is shared between your Sanity project and your Next.js application.

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

    revalidatePath(body.path, 'page')
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

import {client} from '@/sanity/client'
import {POSTS_QUERY} from '@/sanity/lib/queries'
import {POSTS_QUERYResult} from '../../../sanity.types'

export async function PostIndex() {
  const posts = await sanityFetch<POSTS_QUERYResult>({
    query: POSTS_QUERY,
    tags: ['post', 'author'], // revalidate all pages with the tags 'post' and 'author'
  })

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id}>
          <a href={post?.slug.current}>{post?.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

**Create** a new environment variable `SANITY_REVALIDATE_SECRET` with a random string that is shared between your Sanity project and your Next.js application.

```bash
# .env.local

SANITY_REVALIDATE_SECRET=<some-random-string>
```

**Create** a new API route in your Next.js application

The code example below uses the built-in `parseBody` function to validate that the request comes from your Sanity project (using a shared secret and looking at the request headers). Then it looks at the document type information in the webhook payload and matches that against the revalidation tags in your application

```ts
// ./src/app/api/revalidate/route.ts

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

### Example implementation

Check out the [Personal website template][personal-website-template] to see a feature-complete example of how `revalidateTag` is used together with Visual Editing.

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

## Visual editing

Interactive live previews of draft content are the best way for authors to find and edit content with the least amount of effort and the most confidence to press publish.

> [!TIP]
> Visual Editing is available on all Sanity plans and can be enabled on all hosting environments.

> [!NOTE]
> Vercel ["Content Link"][vercel-content-link] additionally enables an edit button to the Vercel toolbar in preview builds is available on Vercel Pro and Enterprise plans.

### Configuring Sanity Client and `sanityFetch()` for Visual Editing

Explaining the updated `createClient` configuration below:

- `stega.enabled` enables [Stega-encoding][stega-encoding] add [Content Source Maps][content-source-maps] to the response. These invisible characters are what power click-to-edit overlays when Visual Editing is enabled. It should always be disabled in production, outside of when Visual Editing is enabled.
- `stega.studioUrl` can be either your [embedded Studio route](#embedded-sanity-studio) or the full URL to a separately deployed Sanity Studio.
- `perspective` set in the `client.fetch()` modifies the [Content Lake Perspective][perspectives-docs] to return draft versions of documents as if they were published.

**Create** a token with Viewer permissions in [sanity.io/manage](https://www.sanity.io/manage) and add it to your environment variables.

```bash
# .env.local

SANITY_API_READ_TOKEN=<your-viewer-token>
```

**Update** your Sanity Client and `sanityFetch()` configuration

```ts
// ./src/sanity/client.ts
import 'server-only'

import {draftMode} from 'next/headers'
import {createClient, type QueryOptions, type QueryParams} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

export const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // Set to true if statically generating pages, using ISR or time-based revalidation
  stega: {
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview',
    studioUrl: '/studio', // Or: 'https://my-cool-project.sanity.studio'
  },
})

const token = process.env.SANITY_API_READ_TOKEN

export async function sanityFetch<QueryResponse>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: string
  params?: QueryParams
  revalidate?: number | boolean
  tags?: string[]
}) {
  const isDraftMode = draftMode().isEnabled
  if (isDraftMode && !token) {
    throw new Error('Missing environment variable SANITY_API_READ_TOKEN')
  }

  const REVALIDATE_SKIP_CACHE = 0

  return client.fetch<QueryResponse>(query, params, {
    ...(isDraftMode &&
      ({
        token: token,
        perspective: 'previewDrafts',
        stega: true,
      } satisfies QueryOptions)),
    next: {
      revalidate: isDraftMode ? REVALIDATE_SKIP_CACHE : revalidate,
      tags,
    },
  })
}
```

**Update** your root layout to include the `<VisualEditing />` component.

This component handles hydrating the page with draft documents as edits are made. The code example below also adds a button to disable draft mode.

```tsx
// ./src/app/layout.tsx

import {VisualEditing} from 'next-sanity'
import {draftMode} from 'next/headers'

import './globals.css'

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>
        {draftMode().isEnabled && (
          <a className="block bg-blue-300 p-4" href="/api/draft-mode-disable">
            Disable preview mode
          </a>
        )}
        {children}
        {draftMode().isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
```

With these changes made your application is now ready to Visual Editing, you just need a way to enable it.

### Using `draftMode()` to toggle Visual Editing

The code above relies on Next.js ["Draft Mode"][draft-mode] to toggle Visual Editing. This can be used to conditionally toggle draft previews and Visual Editing.

**Create** an API route in your Next.js application to toggle Draft Mode

```ts
// ./src/app/api/draft-mode-enable/route.ts

import {draftMode} from 'next/headers'

// This is an unsecure example of enabling draft mode,
// it will allow anyone to see draft content, do not ship to production!
// See the section below on Presentation for a secure route
export async function GET(request: Request) {
  draftMode().enable()
  return new Response('Draft mode is enabled')
}
```

**Create** an API route in your Next.js application to disable Draft Mode

```ts
// ./src/app/api/draft-mode-disable/route.ts

import {draftMode} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'

export function GET(request: NextRequest) {
  draftMode().disable()
  return new Response('Draft mode is disabled')
}
```

If you visit `/api/draft-mode-enable` in your browser, you will see a message that Draft Mode is enabled. You should also now see draft content being rendered in your Next.js application, as well as the ability to hover over any content and see a blue box to open any piece of content in Sanity Studio.

### Using Presentation for secure Visual Editing

For the closest relationship between your Next.js application and your Sanity Studio, install and configure the [Presentation][presentation] plugin. It will handle creating a secure URL to toggle draft mode, as well as the ability to navigate and edit the website from an interactive preview rather than a separate tab or window.

The following assumes you are using an [embedded Sanity Studio](#embedded-sanity-studio).

**Update** your `sanity.config.ts` file to include the Presentation plugin:

```ts
// sanity.config.ts

import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
// ...other imports

export default defineConfig({
  // ... other project config

  plugins: [
    // Add 'presentationTool' to the 'plugins' array
    presentationTool({
      previewUrl: {draftMode: {enable: '/api/draft-mode-enable'}},
    }),
    // ...other plugins
  ],
})
```

**Update** your API route for enabling draft mode.

Presentation will first visit a the URL with a secret parameter which is stored in the dataset. The Sanity Client in the API route contains a token to verify the secret. If confirmed, it will enable draft mode.

```ts
// ./app/api/draft/route.ts

import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {draftMode} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'

import {client} from '@/sanity/lib/client'

export async function GET(request: NextRequest) {
  if (!process.env.SANITY_API_READ_TOKEN) {
    return new Response('Missing environment variable SANITY_API_READ_TOKEN', {status: 500})
  }

  const clientWithToken = client.withConfig({
    token: process.env.SANITY_API_READ_TOKEN,
    stega: false,
  })
  const {isValid, redirectTo = '/'} = await validatePreviewUrl(clientWithToken, request.url)

  if (!isValid) {
    return new Response('Invalid secret', {status: 401})
  }

  draftMode().enable()

  return NextResponse.redirect(redirectTo)
}
```

Now open your Sanity Studio and navigate to the Presentation plugin. It should seamlessly open the home page with Visual Editing enabled, allowing you to click-to-edit any content from Sanity and see changes in real time.

## Enhanced Visual Editing with React Loader

In the previous section, Visual Editing works by the client-side `<VisualEditing />` component intermittently rehydrating content with server-side updates. This is typically enough for most projects. However, for sub-millisecond updates when using Visual Editing inside Presentation, consider switching your data fetching to React Loader.

[React Loader][react-loader] provides both a server-side method of fetching data along with client side hooks for updating them. With these configured, draft content is transmitted between Presentation and your Next.js application _without_ a network round-trip. It also allows you to toggle the current Perspective when using Presentation.

<<<NOTES ON REACT LOADER>>>

## Embedded Sanity Studio

As a React component, Sanity Studio is a near-infinitely configurable content editing interface that can be embedded into any React application. For Next.js, you can embed the Studio on a route (like `/studio`). The Studio will still require authentication and be available only for members of your Sanity project.

This opens up many possibilities including dynamic configuration of your Sanity Studio based on a network request or user input.

> [!WARNING]
> The convenience of co-locating the Studio with your Next.js application is appealing, but it can also influence your content model to be too website-centric, and potentially make collaboration with other developers more difficult. Consider a standalone Studio, or monorepo setup for larger projects and teams.

### Creating a Studio route

`next-sanity` exports a `<NextStudio />` component to load Sanity's `<Studio />` component wrapped in a Next.js friendly layout. `metadata` specifies the necessary `<meta>` tags for making the Studio adapt to mobile devices, and prevents the route from being indexed by search engines.

### Automatic installation

To quickly connect an existing - or create a new - Sanity project to your Next.js application, run the following command in your terminal. You will be prompted to create a route for the Studio during setup.

```bash
npx sanity@latest init
```

### Manual installation

**Create** a file `sanity.config.ts` in the project's root and copy the example below:

```ts
// ./sanity.config.ts

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

### Lower level control with `StudioProvider` and `StudioLayout`

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
[ci-workflow]: https://github.com/sanity-io/next-sanity/actions/workflows/ci.yml
[content-source-maps-intro]: https://www.sanity.io/blog/content-source-maps-announce?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[content-source-maps]: https://www.sanity.io/docs/content-source-maps?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[draft-mode]: https://nextjs.org/docs/app/building-your-application/configuring/draft-mode
[embedded-studio-demo]: https://next.sanity.build/studio
[enterprise-cta]: https://www.sanity.io/enterprise?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
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
[next-data-fetching]: https://nextjs.org/docs/basic-features/data-fetching/overview
[next-preview-mode]: https://nextjs.org/docs/advanced-features/preview-mode
[next-revalidate-docs]: https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate
[pages-router]: https://nextjs.org/docs/pages/building-your-application/routing
[personal-website-template]: https://github.com/sanity-io/template-nextjs-personal-website
[perspectives-docs]: https://www.sanity.io/docs/perspectives?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[portable-text]: https://portabletext.org
[preivew-app-router]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/PREVIEW-app-router.md
[preview-kit-client]: https://github.com/sanity-io/preview-kit#sanitypreview-kitclient
[preview-kit-documentation]: https://github.com/sanity-io/preview-kit#sanitypreview-kit-1
[preview-kit-livequery]: https://github.com/sanity-io/preview-kit#using-the-livequery-wrapper-component-instead-of-the-uselivequery-hook
[preview-kit]: https://github.com/sanity-io/preview-kit
[preview-pages-router]: https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/PREVIEW-pages-router.md
[revalidate-tag]: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
[sales-cta]: https://www.sanity.io/contact/sales?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-client]: https://www.sanity.io/docs/js-client?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity]: https://www.sanity.io?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[visual-editing-intro]: https://www.sanity.io/blog/visual-editing-sanity-vercel?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[visual-editing]: https://www.sanity.io/docs/vercel-visual-editing?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[webhook-template-revalidate-tag]: https://www.sanity.io/manage/webhooks/share?name=Tag-based+Revalidation+Hook+for+Next.js+13+&description=1.+Replace+URL+with+the+preview+or+production+URL+for+your+revalidation+handler+in+your+Next.js+app%0A2.%C2%A0Insert%2Freplace+the+document+types+you+want+to+be+able+to+make+tags+for+in+the+Filter+array%0A3.%C2%A0Make+a+Secret+that+you+also+add+to+your+app%27s+environment+variables+%28SANITY_REVALIDATE_SECRET%29%0A%0AFor+complete+instructions%2C+see+the+README+on%3A%0Ahttps%3A%2F%2Fgithub.com%2Fsanity-io%2Fnext-sanity&url=https%3A%2F%2FYOUR-PRODUCTION-URL.TLD%2Fapi%2Frevalidate&on=create&on=update&on=delete&filter=_type+in+%5B%22post%22%2C+%22home%22%2C+%22OTHER_DOCUMENT_TYPE%22%5D&projection=%7B_type%7D&httpMethod=POST&apiVersion=v2021-03-25&includeDrafts=&headers=%7B%7D
[webhook-template-revalidate-path]: https://www.sanity.io/manage/webhooks/share?name=Path-based+Revalidation+Hook+for+Next.js&description=1.+Replace+URL+with+the+preview+or+production+URL+for+your+revalidation+handler+in+your+Next.js+app%0A2.%C2%A0Insert%2Freplace+the+document+types+you+want+to+be+able+to+make+tags+for+in+the+Filter+array%0A3.%C2%A0Make+a+Secret+that+you+also+add+to+your+app%27s+environment+variables+%28SANITY_REVALIDATE_SECRET%29%0A%0AFor+complete+instructions%2C+see+the+README+on%3A%0Ahttps%3A%2F%2Fgithub.com%2Fsanity-io%2Fnext-sanity&url=https%3A%2F%2FYOUR-PRODUCTION-URL.TLD%2Fapi%2Frevalidate-path&on=create&on=update&on=delete&filter=_type+in+%5B%22post%22%2C+%22home%22%2C+%22OTHER_DOCUMENT_TYPES%22%5D&projection=%7B%0A++%22path%22%3A+select%28%0A++++_type+%3D%3D+%22post%22+%3D%3E+%22%2Fposts%2F%22+%2B+slug.current%2C%0A++++slug.current%0A++%29%0A%7D&httpMethod=POST&apiVersion=v2021-03-25&includeDrafts=&headers=%7B%7D
[vercel-enterprise]: https://vercel.com/docs/accounts/plans/enterprise?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-typegen]: https://www.sanity.io/docs/sanity-typegen?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-typegen-monorepo]: https://www.sanity.io/docs/sanity-typegen#1a6a147d6737?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-typegen-queries]: https://www.sanity.io/docs/sanity-typegen#c3ef15d8ad39?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-graphql]: https://www.sanity.io/docs/graphql?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[vs-code-extension]: https://marketplace.visualstudio.com/items?itemName=sanity-io.vscode-sanity
[sanity-studio]: https://www.sanity.io/docs/sanity-studio?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[groq-functions]: https://www.sanity.io/docs/groq-functions?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[vercel-content-link]: https://vercel.com/docs/workflow-collaboration/edit-mode#content-link?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[stega-encoding]: https://www.sanity.io/docs/stega#fad3406bd530?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[presentation]: https://www.sanity.io/docs/configuring-the-presentation-tool?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[react-loader]: https://www.sanity.io/docs/react-loader?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
