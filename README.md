# next-sanity<!-- omit in toc -->

The official [Sanity.io][sanity] toolkit for Next.js apps.

**Features:**

- The [Sanity Client][sanity-client] fully compatible with [Next.js’ caching features][next-cache]
- [Live Preview mode][preview-kit]
- [Visual Editing](#visual-editing-with-content-source-maps)
- [GROQ syntax highlighting][groq-syntax-highlighting]
- Embedded Sanity Studio

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
  - [Common dependencies](#common-dependencies)
  - [Peer dependencies for embedded Sanity Studio](#peer-dependencies-for-embedded-sanity-studio)
- [Usage](#usage)
  - [Quick start](#quick-start)
  - [App Router Components](#app-router-components)
  - [Page Router Components](#page-router-components)
  - [Should `useCdn` be `true` or `false`?](#should-usecdn-be-true-or-false)
  - [How does `apiVersion` work?](#how-does-apiversionwork)
- [Cache revalidation](#cache-revalidation)
  - [Time-based revalidation](#time-based-revalidation)
  - [Tag-based revalidation webhook](#tag-based-revalidation-webhook)
  - [Slug-based revalidation for the Pages Router](#slug-based-revalidation-for-the-pages-router)
  - [Working example implementation](#working-example-implementation)
  - [Debugging caching and revalidation](#debugging-caching-and-revalidation)
- [Preview](#preview)
  - [Using Perspectives](#using-perspectives)
  - [Live Preview](#live-preview)
  - [Using `draftMode()` to de/activate previews](#using-draftmode-to-deactivate-previews)
- [Visual Editing with Content Source Maps](#visual-editing-with-content-source-maps)
- [Embedded Sanity Studio](#embedded-sanity-studio)
  - [Configuring Sanity Studio on a route](#configuring-sanity-studio-on-a-route)
  - [Manual installation](#manual-installation)
  - [Studio route with App Router](#studio-route-with-app-router)
  - [Studio Routes with Pages Router](#studio-routes-with-pages-router)
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

Building with Sanity and Next.js, you‘re likely to want libraries to handle [On-Demand Image Transformations][image-url] and block content with [Portable Text][portable-text]:

```bash
npm install @portabletext/react @sanity/image-url
```

```bash
yarn add @portabletext/react @sanity/image-url
```

```bash
pnpm install @portabletext/react @sanity/image-url
```

```bash
bun install @portabletext/react @sanity/image-url
```

### Peer dependencies for embedded Sanity Studio

When using `npm` newer than `v7`, or `pnpm` newer than `v8`, you should end up with needed dependencies like `sanity` and `styled-components` when you `npm install next-sanity`. It also works in `yarn` `v1` using `install-peerdeps`:

```bash
npx install-peerdeps --yarn next-sanity
```

## Usage

There are different ways to integrate Sanity with Next.js depending on your usage and needs for features like Live Preview, tag-based revalidation, and so on. It's possible to start simple and add more functionality as your project progresses.

### Quick start

To start running GROQ queries with `next-sanity`, we recommend creating a `client.ts` file:

```ts
// ./src/utils/sanity/client.ts
import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // if you're using ISR or only static generation at build time then you can set this to `false` to guarantee no stale content
})
```

### App Router Components

To fetch data in a React Server Component using the [App Router][app-router]:

```tsx
// ./src/app/page.tsx
import {client} from '@/src/utils/sanity/client'

type Post = {
  _id: string
  title?: string
  slug?: {
    current: string
  }
}

export async function PostIndex() {
  const posts = await client.fetch<Post[]>(`*[_type == "post"]`)

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

### Page Router Components

If you're using the [Pages Router][pages-router], then you can do the following from a page component:

```tsx
// ./src/pages/index.tsx
import {client} from '@/src/utils/sanity/client'

type Post = {
  _id: string
  title?: string
  slug?: {
    current: string
  }
}

export async function getStaticProps() {
  return await client.fetch<Post[]>(`*[_type == "post"]`)
}

export async function HomePage(props) {
  const {posts} = props

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

You might notice that you have to set the `useCdn` to `true` or `false` in the client configuration. Sanity offers [caching on a CDN for content queries][cdn]. Since Next.js often comes with its own caching, it might not be necessary, but there are some exceptions.

The general rule is that `useCdn` should be `true` when:

- Data fetching happens client-side, for example, in a `useEffect` hook or in response to a user interaction where the `client.fetch` call is made in the browser.
- Server-Side Rendered (SSR) data fetching is dynamic and has a high number of unique requests per visitor, for example, a "For You" feed.

And it makes sense to set `useCdn` to `false` when:

- Used in a static site generation context, for example, `getStaticProps` or `getStaticPaths`.
- Used in an ISR on-demand webhook responder.
- Good `stale-while-revalidate` caching is in place that keeps API requests on a consistent low, even if traffic to Next.js spikes.
- For Preview or Draft modes as part of an editorial workflow, you need to ensure that the latest content is always fetched.

### How does `apiVersion` work?

Sanity uses [date-based API versioning][api-versioning]. The tl;dr is that you can send the implementation date in a YYYY-MM-DD format, and it will automatically fall back on the latest API version of that time. Then, if a breaking change is introduced later, it won't break your application and give you time to test before upgrading (by setting the value to a date past the breaking change).

## Cache revalidation

This toolkit includes the [`@sanity/client`][sanity-client] that fully supports Next.js’ `fetch` based features, [including the `revalidateTag` API][revalidate-tag]. It‘s _not necessary_ to use the `React.cache` method like with many other third-party SDKs. This gives you tools to ensure great performance while preventing stale content in a way that's native to Next.js.

> **Note**
>
> Some hosts (like Vercel) will keep the content cache in a dedicated data layer and not part of the static app bundle, which means that it might not be revalidated from re-deploying the app like it has done earlier. We recommend reading up on [caching behavior in the Next.js docs][next-cache].

### Time-based revalidation

Time-based revalidation is best for less complex cases and where content updates don't need to be immediately available.

```tsx
// ./src/app/home/layout.tsx
import { client } from '@/src/utils/sanity/client'
import { PageProps } from '@/src/app/(page)/Page.tsx'

type HomePageProps = {
  _id: string
  title?: string
  navItems: PageProps[]
}

export async function HomeLayout({children}) {
  const home = await client.fetch<HomePageProps>(`*[_id == "home"][0]{...,navItems[]->}`,
    next: {
      revalidate: 3600 // look for updates to revalidate cache every hour
    }
  })

  return (
    <main>
      <nav>
        <span>{home?.title}</span>
        <ul>
        {home?.navItems.map(navItem => ({
          <li key={navItem._id}><a href={navItem?.slug?.current}>{navItem?.title}</a></li>
        }))}
        </ul>
      </nav>
      {children}
    </main>
  )
}
```

### Tag-based revalidation webhook

Tag-based or on-demand revalidation gives you more fine-grained and precise control for when to revalidate content. This is great for pulling content from the same source across components and when content freshness is important.

Below is an example configuration that ensures the client is only bundled server-side and comes with some defaults. It‘s also easier to adapt for Live Preview functionality (see below).

If you're planning to use `revalidateTag`, then remember to set up the webhook (see code below) as well.

```ts
// ./src/utils/sanity/client.ts
import 'server-only'

import type {QueryParams} from '@sanity/client'
import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: false,
})

const DEFAULT_PARAMS = {} as QueryParams
const DEFAULT_TAGS = [] as string[]

export async function sanityFetch<QueryResponse>({
  query,
  params = DEFAULT_PARAMS,
  tags = DEFAULT_TAGS,
}: {
  query: string
  params?: QueryParams
  tags: string[]
}): Promise<QueryResponse> {
  return client.fetch<QueryResponse>(query, params, {
    cache: 'force-cache',
    next: {
      //revalidate: 30, // for simple, time-based revalidation
      tags, // for tag-based revalidation
    },
  })
}
```

Now you can import the `sanityFetch()` function in any component within the `app` folder, and specify for which document types you want it to revalidate:

```tsx
// ./src/app/home/layout.tsx
import { sanityFetch } from '@/src/utils/sanity/client'
import { PageProps } from '@/src/app/(page)/Page.tsx'

type HomePageProps = {
  _id: string
  title?: string
  navItems: PageProps[]
}

export async function HomeLayout({children}) {
  // revalidate if there are changes to either the home document or to a page document (since they're referenced to in navItems)
  const home = await sanityFetch<HomePageProps>({
    query: `*[_id == "home"][0]{...,navItems[]->}`,
    tags: ['home', 'page']
    })

  return (
    <main>
      <nav>
        <span>{home?.title}</span>
        <ul>
        {home?.navItems.map(navItem => ({
          <li key={navItem._id}><a href={navItem?.slug?.current}>{navItem?.title}</a></li>
        }))}
        </ul>
      </nav>
      {children}
    </main>
  )
}
```

In order to get `revalidateTag` to work you need to set up an API route in your Next.js app that handles an incoming request, typically made by [a GROQ-Powered Webhook][groq-webhook].

You can use this [template][webhook-template] to quickly configure the webhook for your Sanity project.

The code example below uses the built-in `parseBody` function to validate that the request comes from your Sanity project (using a shared secret + looking at the request headers). Then it looks at the document type information in the webhook payload and matches that against the revalidation tags in your app:

```ts
// ./src/app/api/revalidate.ts
import {revalidateTag} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

export async function POST(req: NextRequest) {
  try {
    const {isValidSignature, body} = await parseBody<{_type}>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    )

    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(JSON.stringify({message, isValidSignature, body}), {status: 401})
    }

    if (!body?._type) {
      const message = 'Bad Request'
      return new Response({message, body}, {status: 400})
    }

    // If the `_type` is `page`, then all `client.fetch` calls with
    // `{next: {tags: ['page']}}` will be revalidated
    await revalidateTag(body._type)

    return NextResponse.json({body})
  } catch (err) {
    console.error(err)
    return new Response(err.message, {status: 500})
  }
}
```

You can choose to match tags based on any field or expression since GROQ-Powered Webhooks allow you to freely define the payload.

### Slug-based revalidation for the Pages Router

If you are using the Pages Router and want on-demand revalidation, you'll have to do this by targeting the URLs/slugs for the pages you want to revalidate. If you have nested routes, you will need to adopt the logic to accommodate for that. For example, using `_type` to determine the first segment: `/${body?._type}/${body?.slug.current}`.

```ts
// ./pages/api/revalidate.ts
import type {NextApiRequest, NextApiResponse} from 'next'
import {parseBody} from 'next-sanity/webhook'

// Export the config from next-sanity to enable validating the request body signature properly
export {config} from 'next-sanity/webhook'

export default async function revalidate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {isValidSignature, body} = await parseBody(req, process.env.SANITY_REVALIDATE_SECRET)

    if (!isValidSignature) {
      const message = 'Invalid signature'
      return res.status(401).json({message, isValidSignature, body})
    }

    const staleRoute = `/${body.slug.current}`
    await res.revalidate(staleRoute)
    const message = `Updated route: ${staleRoute}`
    return res.status(200).json({message, body})
  } catch (err) {
    console.error(err)
    return res.status(500).json({message: err.message})
  }
}
```

### Working example implementation

Check out our [Personal website template][personal-website-template] to see a feature-complete example of how `revalidateTag` is used together with Live Previews.

### Debugging caching and revalidation

To aid in debugging and understanding what's in the cache, revalidated, skipped, and more, add the following to your Next.js configuration file:

```js
// ./next.config.js
module.exports = {
  experimental: {
    logging: 'verbose',
  },
}
```

## Preview

There are different ways to set up content previews with Sanity and Next.js.

### Using Perspectives

[Perspectives][perspectives-docs] is a feature for Sanity Content Lake that lets you run the same queries but pull the right content variations for any given experience. The default value is `raw`, which means no special filtering is applied, while `published` and `previewDrafts` can be used to optimize for preview and ensure that no draft data leaks into production for authenticated requests.

```ts
// ./src/utils/sanity/client.ts
import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'
const token = process.env.SECRET_SANITY_VIEW_TOKEN

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // if you're using ISR or only static generation at build time then you can set this to `false` to guarantee no stale content
  token,
  perspective: 'published', // prevent drafts from leaking through even though requests are authenticated
})
```

### Live Preview

Live Preview gives you real-time preview across your whole app for your Sanity project members. The Live Preview can be set up to give the preview experience across the whole app. Live Preview works on the data layer and doesn't require specialized components or data attributes. However, it needs a thin component wrapper to load server-side components into client-side, in order to rehydrate on changes.

Router-specific setup guides for Live Preview:

- [`app-router`][preivew-app-router]
- [`pages-router`][preview-pages-router]

Since `next-sanity/preview` is simply re-exporting `LiveQueryProvider` and `useLiveQuery` from [`@sanity/preview-kit`, you'll find advanced usage and comprehensive docs in its README][preview-kit-documentation].
The [same is true][preview-kit-livequery] for `next-sanity/preview/live-query`.

### Using `draftMode()` to de/activate previews

Next.js gives you [a built-in `draftMode` variable][draft-mode] that can activate features like Visual Edit or any preview implementation.

```ts
// ./src/utils/sanity/client.ts
import 'server-only'

import {draftMode} from 'next/headers'
import type {QueryParams} from '@sanity/client'
import {createClient, groq} from 'next-sanity'
import {draftMode} from 'next/headers'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: false,
})

// Used by `PreviewProvider`
export const token = process.env.SANITY_API_READ_TOKEN

const DEFAULT_PARAMS = {} as QueryParams
const DEFAULT_TAGS = [] as string[]

export async function sanityFetch<QueryResponse>({
  query,
  params = DEFAULT_PARAMS,
  tags = DEFAULT_TAGS,
}: {
  query: string
  params?: QueryParams
  tags: string[]
}): Promise<QueryResponse> {
  const isDraftMode = draftMode().isEnabled
  if (isDraftMode && !token) {
    throw new Error('The `SANITY_API_READ_TOKEN` environment variable is required.')
  }

  const REVALIDATE_SKIP_CACHE = 0
  const REVALIDATE_CACHE_FOREVER = false

  return client.fetch<QueryResponse>(query, params, {
    ...(isDraftMode && {
      token: token,
      perspective: 'previewDrafts',
    }),
    next: {
      revalidate: isDraftMode ? REVALIDATE_SKIP_CACHE : REVALIDATE_CACHE_FOREVER,
      tags,
    },
  })
}
```
#### Using `cache` and `revalidation` at the same time

Be aware that you can get errors if you use the `cache` and the `revalidate` configurations for Next.js cache at the same time. Go to [the Next.js docs][next-revalidate-docs] to learn more.


## Visual Editing with Content Source Maps

> **Note**
>
> [Content Source Maps][content-source-maps-intro] are available [as an API][content-source-maps] for select [Sanity enterprise customers][enterprise-cta]. [Contact our sales team for more information.][sales-cta]

The `createClient` method in `next-sanity` supports [visual editing][visual-editing-intro], it supports all the same options as [`@sanity/preview-kit/client`][preview-kit-client]. Add `studioUrl` to your client configuration and it'll automatically show up on Vercel Preview Deployments:

```tsx
import {createClient, groq} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2023-05-03"

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // if you're using ISR or only static generation at build time, then you can set this to `false` to guarantee no stale content
  studioUrl: '/studio', // Or: 'https://my-cool-project.sanity.studio'
  encodeSourceMap: true, // Optional. Default to: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview',
})
```

Go to our [setup guide][visual-editing] for a walkthrough on how to customize the experience.

## Embedded Sanity Studio

Sanity Studio allows you to embed a near-infinitely configurable content editing interface into any React application. For Next.js, you can embed the Studio on a route (like `/admin`). The Studio will still require authentication and be available only for members of your Sanity project.

This opens up many possibilities:

- Any service that hosts Next.js apps can now host your Studio.
- Building previews for your content is easier as your Studio lives in the same environment.
- Use [Data Fetching][next-data-fetching] to configure your Studio.
- Easy setup of [Preview Mode][next-preview-mode].

> [See it live][embedded-studio-demo]

### Configuring Sanity Studio on a route

The `NextStudio` component loads up the `import {Studio} from 'sanity'` component for you and wraps it in a Next-friendly layout. `metadata` specifies the necessary `<meta>` tags for making the Studio adapt to mobile devices, and prevents the route from being indexed by search engines.

To quickly scaffold the embedded studio and a Sanity project, you can run the following command in your project folder:

```bash
npx sanity@latest init
```

### Manual installation

Make a file called `sanity.config.ts` (or `.js` for non-TypeScript projects) in the project's root (same place as `next.config.ts`) and copy the example below. Both the Next `/app` and `/pages` examples use this config file:

```ts
// ./sanity.config.ts
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

import {schemaTypes} from './src/schema'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  basePath: '/admin', // <-- important that `basePath` matches the route you're mounting your studio from, it applies to both `/pages` and `/app`

  projectId,
  dataset,
  plugins: [deskTool()],
  schema: {
    types: schemaTypes,
  },
})
```

This example assumes that there is a `src/schema/index.ts` file that exports the schema definitions for Sanity Studio. However, you are free to structure Studio files as you see fit.

To run Sanity CLI commands, add a `sanity.cli.ts` with the same `projectId` and `dataset` as your `sanity.config.ts` to the project root:

```ts
// ./sanity.cli.ts
/* eslint-disable no-process-env */
import {loadEnvConfig} from '@next/env'
import {defineCliConfig} from 'sanity/cli'

const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig(__dirname, dev, {info: () => null, error: console.error})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({api: {projectId, dataset}})
```

Now you can run commands like `npx sanity cors add`. Run `npx sanity help` for a full list of what you can do.

### Studio route with App Router

```tsx
// ./src/app/studio/[[...index]]/page.tsx
import {Studio} from './Studio'

// Ensures the Studio route is statically generated
export const dynamic = 'force-static'

// Set the right `viewport`, `robots` and `referer` meta tags
export {metadata} from 'next-sanity/studio/metadata'

export default function StudioPage() {
  return <Studio />
}
```

```tsx
// ./src/app/studio/[[...index]]/Studio.tsx
'use client'

import {NextStudio} from 'next-sanity/studio'

import config from '../../../sanity.config'

export function Studio() {
  //  Supports the same props as `import {Studio} from 'sanity'`, `config` is required
  return <NextStudio config={config} />
}
```

How to customize meta tags:

```tsx
// ./src/app/studio/[[...index]]/page.tsx
import type {Metadata} from 'next'
import {metadata as studioMetadata} from 'next-sanity/studio/metadata'

import {Studio} from './Studio'

// Set the right `viewport`, `robots` and `referer` meta tags
export const metadata: Metadata = {
  ...studioMetadata,
  // Overrides the viewport to resize behavior
  viewport: `${studioMetadata.viewport}, interactive-widget=resizes-content`,
}

export default function StudioPage() {
  return <Studio />
}
```

### Studio Routes with Pages Router

```tsx
// ./pages/studio/[[...index]].tsx
import Head from 'next/head'
import {NextStudio} from 'next-sanity/studio'
import {metadata} from 'next-sanity/studio/metadata'

import config from '../../sanity.config'

export default function StudioPage() {
  return (
    <>
      <Head>
        {Object.entries(metadata).map(([key, value]) => (
          <meta key={key} name={key} content={value} />
        ))}
      </Head>
      <NextStudio config={config} />
    </>
  )
}
```

### Lower level control with `StudioProvider` and `StudioLayout`

If you want to go to a lower level and have more control over the Studio, you can pass `StudioProvider` and `StudioLayout` from `sanity` as `children`:

```tsx
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
[migrate-v1-to-v4]: ./MIGRATE-v1-to-v4.md
[migrate-v4-to-v5-app]: ./MIGRATE-v4-to-v5-pages-app-router.md
[migrate-v4-to-v5-pages]: ./MIGRATE-v4-to-v5-pages-pages-router.md
[next-cache]: https://nextjs.org/docs/app/building-your-application/caching
[next-data-fetching]: https://nextjs.org/docs/basic-features/data-fetching/overview
[next-preview-mode]: https://nextjs.org/docs/advanced-features/preview-mode
[next-revalidate-docs]: https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate
[pages-router]: https://nextjs.org/docs/pages/building-your-application/routing
[personal-website-template]: https://github.com/sanity-io/sanity-template-nextjs-app-router-personal-website
[perspectives-docs]: https://www.sanity.io/docs/perspectives?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[portable-text]: https://portabletext.org
[preivew-app-router]: ./PREVIEW-app-router.md
[preview-kit-client]: https://github.com/sanity-io/preview-kit#sanitypreview-kitclient
[preview-kit-documentation]: https://github.com/sanity-io/preview-kit#sanitypreview-kit-1
[preview-kit-livequery]: https://github.com/sanity-io/preview-kit#using-the-livequery-wrapper-component-instead-of-the-uselivequery-hook
[preview-kit]: https://github.com/sanity-io/preview-kit
[preview-pages-router]: ./PREVIEW-pages-router.md
[revalidate-tag]: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
[sales-cta]: https://www.sanity.io/contact/sales?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity-client]: https://www.sanity.io/docs/js-client?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[sanity]: https://www.sanity.io?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[visual-editing-intro]: https://www.sanity.io/blog/visual-editing-sanity-vercel?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[visual-editing]: https://www.sanity.io/docs/vercel-visual-editing?utm_source=github&utm_medium=readme&utm_campaign=next-sanity
[webhook-template]: https://www.sanity.io/manage/webhooks/share?name=Tag-based+Revalidation+Hook+for+Next.js+13%2B&description=%5B%C2%A0%5D+Replace+URL+with+the+production*+URL+for+your+revalidation+handler+in+your+Next.js+app%0A%5B+%5D%C2%A0Insert%2Freplace+the+document+types+you+want+to+be+able+to+make+tags+for+in+the+Filter+array%0A%5B+%5D%C2%A0Make+a+Secret+that+you+also+add+to+your+app%27s+environment+variables+%28SANITY_REVALIDATE_SECRET%29%0A%0A*Or+preview+URL+for+preliminary+testing%0A%0AFor+complete+instructions%2C+see+the+README+on%3A%0Ahttps%3A%2F%2Fgithub.com%2Fsanity-io%2Fnext-sanity&url=https%3A%2F%2FYOUR-PRODUCTION-URL.TLD%2Fapi%2Frevalidate&on=create&on=update&on=delete&filter=_type+in+%5B%22post%22%2C+%22home%22%2C+%22OTHER_DOCUMENT_TYPE%22%5D&projection=%7B_type%7D&httpMethod=POST&apiVersion=v2021-03-25&includeDrafts=&headers=%7B%7D
