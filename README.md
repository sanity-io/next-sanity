# next-sanity<!-- omit in toc -->

[Sanity.io](https://www.sanity.io/?utm_source=github&utm_medium=readme&utm_campaign=next-sanity) toolkit for Next.js.

**Features:**

- [Client-side live real-time preview for authenticated users](#live-real-time-preview)
- [GROQ syntax highlighting](https://marketplace.visualstudio.com/items?itemName=sanity-io.vscode-sanity)
- [Embed](#next-sanitystudio) [Studio v3](https://www.sanity.io/studio-v3) in [Next.js](https://nextjs.org/) apps

## Table of contents

- [Installation](#installation)
- [`next-sanity` Running groq queries](#next-sanity-running-groq-queries)
  - [Should `useCdn` be `true` or `false`?](#should-usecdn-be-true-or-false)
  - [`app-router`, React Server Components and caching](#app-router-react-server-components-and-caching)
- [`next-sanity` Visual Editing with Content Source Maps](#next-sanity-visual-editing-with-content-source-maps)
- [`next-sanity/preview` Preview drafts, hot reload on changes](#next-sanitypreview-preview-drafts-hot-reload-on-changes)
- [`next-sanity/studio`](#next-sanitystudio)
- [`next-sanity/webhook`](#next-sanitywebhook)
- [Migration guides](#migration-guides)
- [Release new version](#release-new-version)
- [License](#license)

## Installation

```bash
npm install next-sanity @sanity/client @portabletext/react @sanity/image-url
```

```bash
yarn add next-sanity @sanity/client @portabletext/react @sanity/image-url
```

```bash
pnpm install next-sanity @sanity/client @portabletext/react @sanity/image-url
```

### `next-sanity/studio` peer dependencies

When using `npm` newer than `v7`, or `pnpm` newer than `v8`, you should end up with needed dependencies like `sanity` and `styled-components` when you `npm install next-sanity`. It also works in `yarn` `v1` using `install-peerdeps`:

```bash
npx install-peerdeps --yarn next-sanity
```

## `next-sanity` Running groq queries

```ts
import {createClient, groq} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2023-05-03"

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // if you're using ISR or only static generation at build time then you can set this to `false` to guarantee no stale content
})

const data = await client.fetch(groq`*[]`)
```

### Should `useCdn` be `true` or `false`?

The general rule is that `useCdn` should be `true` when:

- Data fetching happens client-side, e.g. in a `useEffect` hook or in response to a user interaction where the `client.fetch` call is made in the browser.
- SSR data fetching is dynamic and have a high number of unique requests per visitor, e.g. a "For You" feed.

And it makes sense to set `useCdn` to `false` when:

- Used in a static site generation context, e.g. `getStaticProps` or `getStaticPaths`.
- Used in a ISR on-demand webhook responder.
- Good `stale-while-revalidate` caching is in place that keeps API requests on a consistent low, even if traffic to Next.js spikes.
- When in Preview or Draft mode as part of an editorial workflow, and you need to ensure that the latest content is always fetched.

### `app-router`, React Server Components and caching

> We are working on bringing `fetch` support to `@sanity/client` when used by Next.js' `nodejs` runtime. If you're using the `edge` runtime your `client.fetch` calls are automatically deduped.

As `@sanity/client` will only sometimes use `fetch` under the hood, it depends on the environment, [it's best to implement the cache function to ensure reliable deduping of requests.](https://beta.nextjs.org/docs/data-fetching/caching#per-request-cachingmd)

```ts
import {createClient, groq} from 'next-sanity'
import {cache} from 'react'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2023-05-03"

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // if you're using ISR or only static generation at build time then you can set this to `false` to guarantee no stale content
})

// Wrap the cache function in a way that reuses the TypeScript definitions
const clientFetch = cache(client.fetch.bind(client))

// Now use it just like before, fully deduped, cached and optimized by react
const data = await clientFetch(groq`*[]`)
// You can use the same generics as before
const total = await clientFetch<number>(groq`count*()`)
```

Until `@sanity/client` can be updated to use `fetch` in all environments, it's recommended that you configure cache rules and revalidation on the route segment level.

The new `revalidateTags` API is not yet supported, but will be in a future release.

## `next-sanity` Visual Editing with Content Source Maps

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
  useCdn: true, // if you're using ISR or only static generation at build time then you can set this to `false` to guarantee no stale content
  studioUrl: '/studio', // Or: 'https://my-cool-project.sanity.studio'
  encodeSourceMap: true, // Optional. Default to: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview',
})
```

[Our setup guide walks you through how to customize the experience.][visual-editing]

## `next-sanity/preview` Preview drafts, hot reload on changes

Chose a setup guide for the router you're using:

- [`app-router`](./PREVIEW-app-router.md)
- [`pages-router`](./PREVIEW-app-router.md)

Since `next-sanity/preview` is simply re-exporting `LiveQueryProvider` and `useLiveQuery` from [`@sanity/preview-kit` you'll find advanced usage and comprehensive docs in its README](https://github.com/sanity-io/preview-kit#sanitypreview-kit-1).

## `next-sanity/studio`

> [See it live](https://next.sanity.build/studio)

The latest version of Sanity Studio allows you to embed a near-infinitely configurable content editing interface into any React application. This opens up many possibilities:

- Any service that hosts Next.js apps can now host your Studio.
- Building previews for your content is easier as your Studio lives in the same environment.
- Use [Data Fetching](https://nextjs.org/docs/basic-features/data-fetching/overview) to configure your Studio.
- Easy setup of [Preview Mode](https://nextjs.org/docs/advanced-features/preview-mode).

### Usage

`NextStudio` loads up the `import {Studio} from 'sanity'` component for you and wraps it in a Next-friendly layout. `metadata` specifies the necessary `<meta>` tags for making the Studio adapt to mobile devices, and prevents the route from being indexed by search engines.

Both the Next `/app` and `/pages` examples uses this config file:
`sanity.config.ts`:

```ts
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  basePath: '/studio', // <-- important that `basePath` matches the route you're mounting your studio from, it applies to both `/pages` and `/app`

  projectId,
  dataset,

  plugins: [deskTool()],

  schema: {
    types: schemaTypes,
  },
})
```

To use `sanity.cli.ts` with the same `projectId` and `dataset` as your `sanity.config.ts`:

```ts
/* eslint-disable no-process-env */
import {loadEnvConfig} from '@next/env'
import {defineCliConfig} from 'sanity/cli'

const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig(__dirname, dev, {info: () => null, error: console.error})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({api: {projectId, dataset}})
```

Now you can run commands like `npx sanity cors add`. See `npx sanity help` for a full list of what you can do.

#### Using `app-router`

`app/studio/[[...index]]/page.tsx`:

```tsx
import {Studio} from './Studio'

// Set the right `viewport`, `robots` and `referer` meta tags
export {metadata} from 'next-sanity/studio/metadata'

export default function StudioPage() {
  return <Studio />
}
```

`app/studio/[[...index]]/Studio.tsx`:

```tsx
'use client'

import {NextStudio} from 'next-sanity/studio'

import config from '../../../sanity.config'

export function Studio() {
  //  Supports the same props as `import {Studio} from 'sanity'`, `config` is required
  return <NextStudio config={config} />
}
```

Customize meta tags
`app/studio/[[...index]]/page.tsx`:

```tsx
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

#### Using `pages-router`

`/pages/studio/[[...index]].tsx`:

```tsx
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

### Opt-in to using `StudioProvider` and `StudioLayout`

If you want to go lower level and have more control over the studio you can pass `StudioProvider` and `StudioLayout` from `sanity` as `children`:

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

## `next-sanity/webhook`

Implements [`@sanity/webhook`](https://github.com/sanity-io/webhook-toolkit) to parse and verify that a [Webhook](https://www.sanity.io/docs/webhooks) is indeed coming from Sanity infrastructure.

`pages/api/revalidate`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next'
import {parseBody} from 'next-sanity/webhook'

// Export the config from next-sanity to enable validating the request body signature properly
export {config} from 'next-sanity/webhook'

export default async function revalidate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {isValidSignature, body} = await parseBody(req, process.env.SANITY_REVALIDATE_SECRET)

    if (!isValidSignature) {
      const message = 'Invalid signature'
      console.warn(message)
      res.status(401).json({message})
      return
    }

    const staleRoute = `/${body.slug.current}`
    await res.revalidate(staleRoute)
    const message = `Updated route: ${staleRoute}`
    console.log(message)
    return res.status(200).json({message})
  } catch (err) {
    console.error(err)
    return res.status(500).json({message: err.message})
  }
}
```

## Migration guides

- From `v4` to `v5`
  - [`app-router`](./MIGRATE-v4-to-v5-app-router.md)
  - [`pages-router`](./MIGRATE-v4-to-v5-pages-router.md)
- [From `<0.4` to `v4`](./MIGRATE-v1-to-v4.md)

## Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/next-sanity/actions/workflows/ci.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

MIT-licensed. See [LICENSE](LICENSE).

[visual-editing]: https://www.sanity.io/docs/vercel-visual-editing?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch
[visual-editing-intro]: https://www.sanity.io/blog/visual-editing-sanity-vercel?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch
[content-source-maps]: https://www.sanity.io/docs/content-source-maps?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch
[content-source-maps-intro]: https://www.sanity.io/blog/content-source-maps-announce?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch
[preview-kit-client]: https://github.com/sanity-io/preview-kit#sanitypreview-kitclient
[sales-cta]: https://www.sanity.io/contact/sales?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch
[enterprise-cta]: https://www.sanity.io/enterprise?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch
