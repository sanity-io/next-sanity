# next-sanity<!-- omit in toc -->

[Sanity.io](https://www.sanity.io/?utm_source=github&utm_medium=readme&utm_campaign=next-sanity) toolkit for Next.js.

**Features:**

- [Client-side live real-time preview for authenticated users](#live-real-time-preview)
- [GROQ syntax highlighting](https://marketplace.visualstudio.com/items?itemName=sanity-io.vscode-sanity)
- [Embed](#next-sanitystudio) [Studio v3](https://www.sanity.io/studio-v3) in [Next.js](https://nextjs.org/) apps

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [`next-sanity` Running groq queries](#next-sanity-running-groq-queries)
  - [`appDir`, React Server Components and caching](#appdir-react-server-components-and-caching)
- [`next-sanity/preview` Live real-time preview](#next-sanitypreview-live-real-time-preview)
  - [Examples](#examples)
    - [Built-in Sanity auth](#built-in-sanity-auth)
      - [Using the `/pages` directory](#using-the-pages-directory)
      - [Using the `/app` directory (experimental)](#using-the-app-directory-experimental)
    - [Custom token auth](#custom-token-auth)
      - [Using the `/pages` directory](#using-the-pages-directory-1)
      - [Using the `/app` directory (experimental)](#using-the-app-directory-experimental-1)
  - [Starters](#starters)
  - [Limits](#limits)
- [`next-sanity/studio`](#next-sanitystudio)
  - [Usage](#usage)
    - [Using the `/app` directory (experimental)](#using-the-app-directory-experimental-2)
    - [Using the `/pages` directory](#using-the-pages-directory-2)
  - [Opt-in to using `StudioProvider` and `StudioLayout`](#opt-in-to-using-studioprovider-and-studiolayout)
- [`next-sanity/webhook`](#next-sanitywebhook)
- [Migrate](#migrate)
  - [From `v2`](#from-v2)
    - [`NextStudioGlobalStyle` is removed](#nextstudioglobalstyle-is-removed)
    - [`ServerStyleSheetDocument` is removed](#serverstylesheetdocument-is-removed)
    - [The internal `isWorkspaceWithTheme` and `isWorkspaces` utils are no longer exported](#the-internal-isworkspacewiththeme-and-isworkspaces-utils-are-no-longer-exported)
    - [The `useBackgroundColorsFromTheme`, `useBasePath`, `useConfigWithBasePath`, and `useTextFontFamilyFromTheme`, hooks are removed](#the-usebackgroundcolorsfromtheme-usebasepath-useconfigwithbasepath-and-usetextfontfamilyfromtheme-hooks-are-removed)
    - [The `NextStudioHead` component has moved from `next-sanity/studio` to `next-sanity/studio/head`](#the-nextstudiohead-component-has-moved-from-next-sanitystudio-to-next-sanitystudiohead)
  - [From `v1`](#from-v1)
    - [`createPreviewSubscriptionHook` is replaced with `definePreview`](#createpreviewsubscriptionhook-is-replaced-with-definepreview)
      - [Before](#before)
      - [After](#after)
    - [`createCurrentUserHook` is removed](#createcurrentuserhook-is-removed)
  - [From `v0.4`](#from-v04)
    - [`createPortableTextComponent` is removed](#createportabletextcomponent-is-removed)
    - [`createImageUrlBuilder` is removed](#createimageurlbuilder-is-removed)
- [Release new version](#release-new-version)
- [License](#license)

## Installation

```bash
npm install next-sanity @portabletext/react @sanity/image-url
```

```bash
yarn add next-sanity @portabletext/react @sanity/image-url
```

```bash
pnpm install next-sanity @portabletext/react @sanity/image-url
```

### `next-sanity/studio` peer dependencies

When using `npm` newer than `v7` you should end up with needed dependencies like `sanity` and `styled-components` when you `npm install next-sanity`. For other package managers you may need to do some extra steps.

#### Yarn

```bash
npx install-peerdeps --yarn next-sanity
```

#### pnpm

You can either setup [`auto-install-peers`](https://stackoverflow.com/questions/72468635/pnpm-peer-dependencies-auto-install/74835069#74835069) and `pnpm install next-sanity` is enough, or:

```bash
npx install-peerdeps --pnpm next-sanity
```

## `next-sanity` Running groq queries

```ts
import {createClient, groq} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2022-11-16"

const client = createClient({
  projectId,
  dataset,
  apiVersion, // https://www.sanity.io/docs/api-versioning
  useCdn: true, // if you're using ISR or only static generation at build time then you can set this to `false` to guarantee no stale content
})

const data = await client.fetch(groq`*[]`)
```

### `appDir`, React Server Components and caching

As `@sanity/client` will only sometimes use `fetch` under the hood, it depends on the environment, [it's best to implement the cache function to ensure reliable caching.](https://beta.nextjs.org/docs/data-fetching/caching#per-request-cachingmd)

```ts
import {createClient, groq} from 'next-sanity'
import {cache} from 'react'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2022-11-16"

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
// You can use the same generics as ebfore
const total = await clientFetch<number>(groq`count*()`)
```

## `next-sanity/preview` Live real-time preview

You can implement real-time client side preview using `definePreview`. It works by streaming the whole dataset to the browser, which it keeps updated using [listeners](https://www.sanity.io/docs/realtime-updates) and Mendoza patches. When it receives updates, then the query is run against the client-side datastore using [groq-js](https://github.com/sanity-io/groq-js).
It uses [`@sanity/preview-kit`](https://github.com/sanity-io/preview-kit) under the hood, which can be used in frameworks other than Nextjs if it supports React 18 Suspense APIs.

### Examples

When running `next dev` locally these examples start and exit preview mode by opening [localhost:3000/api/preview](http://localhost:3000/api/preview) and [localhost:3000/api/exit-preview](http://localhost:3000/api/exit-preview).

#### Built-in Sanity auth

Pros:

- Checks if the user is authenticated for you.
- Pairs well with Sanity Studio preview panes.

Cons:

- Doesn't implement a login flow:
  - Requires the user to login to a Sanity Studio prior to starting Preview mode.
  - Requires your Sanity Studio to be hosted on the same origin.
- Currently only supports cookie based auth, and not yet the `dual` [loginMethod in Sanity Studio](https://github.com/sanity-io/sanity/blob/9bf408d4cc8b3e14bac0bf94d3305d6960181d3c/packages/%40sanity/default-login/README.md?plain=1#L37):
  - Safari based browsers (Desktop Safari on Macs, and all browsers on iOS) doesn't work.
  - Doesn't support incognito browser modes.

`pages/api/preview.ts`:

```js
export default function preview(req, res) {
  res.setPreviewData({})
  res.writeHead(307, {Location: '/'})
  res.end()
}
```

`pages/api/exit-preview.ts`:

```js
export default function exit(req, res) {
  res.clearPreviewData()
  res.writeHead(307, {Location: '/'})
  res.end()
}
```

`components/DocumentsCount.tsx`:

```tsx
import groq from 'groq'

export const query = groq`count(*[])`

export function DocumentsCount({data}) {
  return (
    <>
      Documents: <strong>{data}</strong>
    </>
  )
}
```

`lib/sanity.client.ts`

```js
import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2022-11-16"

export const client = createClient({projectId, dataset, apiVersion})
```

`lib/sanity.preview.ts`

```js
import {definePreview} from 'next-sanity/preview'
import {projectId, dataset} from 'lib/sanity.client'

function onPublicAccessOnly() {
  throw new Error(`Unable to load preview as you're not logged in`)
}
export const usePreview = definePreview({projectId, dataset, onPublicAccessOnly})
```

`components/PreviewDocumentsCount.ts`:

```tsx
'use client'

import {usePreview} from 'lib/sanity.preview'
import {query, DocumentsCount} from 'components/DocumentsCount'

export default function PreviewDocumentsCount() {
  const data = usePreview(null, query)
  return <DocumentsCount data={data} />
}
```

##### Using the `/pages` directory

`pages/index.tsx`:

```tsx
import {PreviewSuspense} from 'next-sanity/preview'
import {lazy} from 'react'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {client} from 'lib/sanity.client'

const PreviewDocumentsCount = lazy(() => import('components/PreviewDocumentsCount'))

export const getStaticProps = async ({preview = false}) => {
  if (preview) {
    return {props: {preview}}
  }

  const data = await client.fetch(query)

  return {props: {preview, data}}
}

export default function IndexPage({preview, data}) {
  if (preview) {
    return (
      <PreviewSuspense fallback="Loading...">
        <PreviewDocumentsCount />
      </PreviewSuspense>
    )
  }

  return <DocumentsCount data={data} />
}
```

##### Using the `/app` directory (experimental)

We support the new `appDir` mode in Next, [but please note that `appDir` shouldn't be used in production before Vercel says it's stable](https://beta.nextjs.org/docs/getting-started).

`components/PreviewSuspense.tsx`:

```tsx
'use client'

// Once rollup supports 'use client' module directives then 'next-sanity' will include them and this re-export will no longer be necessary
export {PreviewSuspense as default} from 'next-sanity/preview'
```

`app/page.tsx`:

```tsx
import {previewData} from 'next/headers'
import PreviewSuspense from 'components/PreviewSuspense'
import {DocumentsCount, query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import {client} from 'lib/sanity.client'
import {cache} from 'react'

// Enable NextJS to cache and dedupe queries
const clientFetch = cache(client.fetch.bind(client))

export default async function IndexPage() {
  if (previewData()) {
    return (
      <PreviewSuspense fallback="Loading...">
        <PreviewDocumentsCount />
      </PreviewSuspense>
    )
  }

  const data = await clientFetch(query)
  return <DocumentsCount data={data} />
}
```

#### Custom token auth

By providing a read token (Sanity API token with `viewer` rights) you override the built-in auth and get more control and flexibility.

Pros:

- Allows launching previews for users without necessarily an Sanity account.
- Hosting a Sanity Studio on the same origin is optional.
- Can build preview experiences that start outside a Studio, like "Copy share link" functionality.
- Works in all Safari based browsers (Desktop Safari on Macs, and all browsers on iOS).
- Works with incognito browser modes.

Cons:

- Like all things with great power comes great responsibility. You're responsible for implementing adequate protection against leaking the `token` in your js bundle, or preventing the `/api/preview?secret=${secret}` from being easily guessable.
- It results in a larger JS bundle as `@sanity/groq-store` currently requires `event-source-polyfill` since native `window.EventSource` does not support setting `Authorization` headers needed for the token auth.

`pages/api/preview.ts`:

```js
import getSecret from 'lib/getSecret'

export default async function preview(req, res) {
  // The secret can't be stored in an env variable with a NEXT_PUBLIC_ prefix, as it would make you vulnerable to leaking the token to anyone.
  // If you don't have an custom API with authentication that can handle checking secrets, you may use https://github.com/sanity-io/sanity-studio-secrets to store the secret in your dataset.
  const secret = await getSecret()

  // This is the most common way to check for auth, but we encourage you to use your existing auth infra to protect your token and securely transmit it to the client
  if (!req.query.secret || req.query.secret !== secret) {
    return res.status(401).json({message: 'Invalid secret'})
  }

  res.setPreviewData({token: process.env.SANITY_API_READ_TOKEN})
  res.writeHead(307, {Location: '/'})
  res.end()
}
```

`pages/api/exit-preview.ts`:

```js
export default function exit(req, res) {
  res.clearPreviewData()
  res.writeHead(307, {Location: '/'})
  res.end()
}
```

`components/DocumentsCount.tsx`:

```tsx
import groq from 'groq'

export const query = groq`count(*[])`

export function DocumentsCount({data}) {
  return (
    <>
      Documents: <strong>{data}</strong>
    </>
  )
}
```

`lib/sanity.client.ts`

```js
import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID // "pv8y60vp"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET // "production"
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION // "2022-11-16"

export const client = createClient({projectId, dataset, apiVersion})
```

`lib/sanity.preview.ts`

```js
import {definePreview} from 'next-sanity/preview'
import {projectId, dataset} from 'lib/sanity.client'

export const usePreview = definePreview({projectId, dataset})
```

`components/PreviewDocumentsCount.tsx`:

```tsx
'use client'

import {usePreview} from 'lib/sanity.preview'
import {query, DocumentsCount} from 'components/DocumentsCount'

export default function PreviewDocumentsCount({token}) {
  const data = usePreview(token, query)
  return <DocumentsCount data={data} />
}
```

##### Using the `/pages` directory

`pages/index.tsx`:

```tsx
import {PreviewSuspense} from 'next-sanity/preview'
import {lazy} from 'react'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {client} from 'lib/sanity.client'

// Wrapping preview components in React.lazy ensures visitors not on preview mode doesn't load any JS related to it
const PreviewDocumentsCount = lazy(() => import('components/PreviewDocumentsCount'))

export const getStaticProps = async ({preview = false, previewData = {}}) => {
  if (preview && previewData?.token) {
    return {props: {preview, token: previewData.token}}
  }

  const data = await client.fetch(query)

  return {props: {preview, data}}
}

export default function IndexPage({preview, token, data}) {
  if (preview) {
    return (
      <PreviewSuspense fallback="Loading...">
        <PreviewDocumentsCount token={token} />
      </PreviewSuspense>
    )
  }

  return <DocumentsCount data={data} />
}
```

##### Using the `/app` directory (experimental)

We support the new `appDir` mode in Next, [but please note that `appDir` shouldn't be used in production before Vercel says it's stable](https://beta.nextjs.org/docs/getting-started).

`components/PreviewSuspense.tsx`:

```tsx
'use client'

// Once rollup supports 'use client' module directives then 'next-sanity' will include them and this re-export will no longer be necessary
export {PreviewSuspense as default} from 'next-sanity/preview'
```

`app/page.tsx`:

```tsx
import {previewData} from 'next/headers'
import PreviewSuspense from 'components/PreviewSuspense'
import {DocumentsCount, query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import {client} from 'lib/sanity.client'

type AppPreviewData = {token: string} | undefined
export default async function IndexPage() {
  if ((previewData() as AppPreviewData)?.token) {
    return (
      <PreviewSuspense fallback="Loading...">
        <PreviewDocumentsCount token={(previewData() as AppPreviewData).token} />
      </PreviewSuspense>
    )
  }

  const data = await client.fetch(query)
  return <DocumentsCount data={data} />
}
```

### Starters

- [A Next.js Blog with a Native Authoring Experience](https://github.com/sanity-io/nextjs-blog-cms-sanity-v3)

### Limits

The real-time preview isn't optimized and comes with a configured limit of 3000 documents. You can experiment with larger datasets by configuring the hook with `documentLimit: <Integer>`. Be aware that this might significantly affect the preview performance.
You may use the `includeTypes` option to reduce the amount of documents and reduce the risk of hitting the `documentLimit`:

```js
import {definePreview} from 'next-sanity/preview'

export const usePreview = definePreview({
  projectId,
  dataset,
  documentLimit: 10000,
  includeTypes: ['page', 'product', 'sanity.imageAsset'],
  // If you have a lot of editors changing content at the same time it might help to increase this value
  // to reduce the amount of rerenders React have to perform.
  subscriptionThrottleMs: 300,
})
```

We have plans for optimizations in the roadmap.

## `next-sanity/studio`

> [See it live](https://next.sanity.build/studio)

The latest version of Sanity Studio allows you to embed a near-infinitely configurable content editing interface into any React application. This opens up many possibilities:

- Any service that hosts Next.js apps can now host your Studio.
- Building previews for your content is easier as your Studio lives in the same environment.
- Use [Data Fetching](https://nextjs.org/docs/basic-features/data-fetching/overview) to configure your Studio.
- Easy setup of [Preview Mode](https://nextjs.org/docs/advanced-features/preview-mode).

### Usage

The basic setup is 2 components, `NextStudio` and `NextStudioHead`.
`NextStudio` loads up the `import {Studio} from 'sanity'` component for you and wraps it in a Next-friendly layout.
While `NextStudioHead` sets necessary `<head>` meta tags such as `<meta name="viewport">` to ensure the responsive CSS in the Studio works as expected.

Both the Next `/app` and `/pages` examples uses this config file:
`sanity.config.ts`:

```ts
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  basePath: '/studio', // <-- important that `basePath` matches the route you're mounting your studio from, it applies to both `/pages` and `/app`

  projectId,
  dataset,

  plugins: [deskTool(), visionTool()],

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

#### Using the `/app` directory (experimental)

We support the new `appDir` mode in Next, [but please note that `appDir` shouldn't be used in production before Vercel says it's stable](https://beta.nextjs.org/docs/getting-started).

In Next 13's new `appDir` mode you use `page.tsx` to load `NextStudio`, and optionally (recommended, especially if you want great support for iPhones and other devices with display cutouts like "The Notch" or "Dynamic Island") export `NextStudioHead` in a `head.tsx`.
In routes that load `NextStudio` ensure you have `'use client'` at the top of your file.

`app/studio/[[...index]]/page.tsx`:

```tsx
'use client'

import {NextStudio} from 'next-sanity/studio'

import config from '../../../sanity.config'

export default function StudioPage() {
  //  Supports the same props as `import {Studio} from 'sanity'`, `config` is required
  return <NextStudio config={config} />
}
```

Set the right `viewport` meta tag, favicons and mroe
`app/studio/[[...index]]/head.tsx`:

```tsx
// Re-export `NextStudioHead` as default if you're happy with the default behavior
export {NextStudioHead as default} from 'next-sanity/studio/head'

// To customize it, use it as a children component:
import {NextStudioHead} from 'next-sanity/studio/head'

export default function CustomStudioHead() {
  return (
    <>
      <NextStudioHead favicons={false} />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="https://www.sanity.io/static/images/favicons/favicon-32x32.png"
      />
    </>
  )
}
```

Improve the Studio loading experience by setting a `loading.tsx` route.
`app/studio/[[...index]]/loading.tsx`:

```tsx
'use client'

import config from '../../../sanity.config'
import {NextStudioLoading} from 'next-sanity/studio/loading'

export default function Loading() {
  return <NextStudioLoading config={config} />
}
```

#### Using the `/pages` directory

Using just `NextStudio` gives you a fully working Sanity Studio v3. However we recommend also using `NextStudioHead` as it ensures CSS Media Queries that target mobile devices with display cutouts (for example iPhone's "The Notch" and "Dynamic Island") and other details.

`/pages/studio/[[...index]].tsx`:

```tsx
import Head from 'next/head'
import {NextStudio} from 'next-sanity/studio'
import {NextStudioHead} from 'next-sanity/studio/head'

import config from '../../sanity.config'

export default function StudioPage() {
  return (
    <>
      <Head>
        <NextStudioHead />
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

## Migrate

### From `v2`

The `v3` release only contains breaking changes on the `next-sanity/studio` imports. If you're only using `import {createClient, groq} from 'next-sanity'` or `import {definePreview, PreviewSuspense} from 'next-sanity/preview'` then there's no migration for you to do.

#### `NextStudioGlobalStyle` is removed

The layout is no longer using global CSS to set the Studio height. The switch to local CSS helps interop between Next `/pages` and `/app` layouts.

#### `ServerStyleSheetDocument` is removed

It's no longer necessary to setup `styled-components` SSR for the Studio to render correctly.

#### The internal `isWorkspaceWithTheme` and `isWorkspaces` utils are no longer exported

The `useTheme` hook is still available if you're building abstractions that need to know what the initial workspace theme variables are.

#### The `useBackgroundColorsFromTheme`, `useBasePath`, `useConfigWithBasePath`, and `useTextFontFamilyFromTheme`, hooks are removed

You can `useTheme` to replace `useBackgroundColorsFromTheme` and `useTextFontFamilyFromTheme`:

```tsx
import {useMemo} from 'react'
import {useTheme} from 'next-sanity/studio'
import type {StudioProps} from 'sanity'
export default function MyComponent(props: Pick<StudioProps, 'config'>) {
  const theme = useTheme(config)
  // useBackgroundColorsFromTheme
  const {themeColorLight, themeColorDark} = useMemo(
    () => ({
      themeColorLight: theme.color.light.default.base.bg,
      themeColorDark: theme.color.dark.default.base.bg,
    }),
    [theme]
  )
  // useTextFontFamilyFromTheme
  const fontFamily = useMemo(() => theme.fonts.text.family, [theme])
}
```

The reason why `useBasePath` and `useConfigWithBasePath` got removed is because Next `/pages` and `/app` diverge too much in how they declare dynamic segments. Thus you'll need to specify `basePath` in your `sanity.config.ts` manually to match the route you're loading the studio, for the time being.

#### The `NextStudioHead` component has moved from `next-sanity/studio` to `next-sanity/studio/head`

Its props are also quite different and it now requires you to wrap it in `import Head from 'next/head'` if you're not using a `head.tsx` in `appDir`. Make sure you use TypeScript to ease the migration.

### From `v1`

#### `createPreviewSubscriptionHook` is replaced with `definePreview`

There are several differences between the hooks. First of all, `definePreview` requires React 18 and Suspense. And as it's designed to work with React Server Components you provide `token` in the hook itself instead of in the `definePreview` step. Secondly, `definePreview` encourages code-splitting using `React.lazy` and that means you only call the `usePreview` hook in a component that is lazy loaded. Quite different from `usePreviewSubscription` which was designed to be used in both preview mode, and in production by providing `initialData`.

##### Before

The files that are imported here are the same as the [Next `/pages` example](#using-the-pages-director).

`pages/index.tsx`

```tsx
import {createPreviewSubscriptionHook} from 'next-sanity'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {client, projectId, dataset} from 'lib/sanity.client'

export const getStaticProps = async ({preview = false}) => {
  const data = await client.fetch(query)

  return {props: {preview, data}}
}

const usePreviewSubscription = createPreviewSubscriptionHook({projectId, dataset})
export default function IndexPage({preview, data: initialData}) {
  const {data} = usePreviewSubscription(indexQuery, {initialData, enabled: preview})
  return <DocumentsCount data={data} />
}
```

##### After

`components/PreviewDocumentsCount.tsx`

```tsx
import {definePreview} from 'next-sanity/preview'
import {projectId, dataset} from 'lib/sanity.client'

const usePreview = definePreview({projectId, dataset})
export default function PreviewDocumentsCount() {
  const data = usePreview(null, query)
  return <DocumentsCount data={data} />
}
```

`pages/index.tsx`

```tsx
import {lazy} from 'react'
import {PreviewSuspense} from 'next-sanity/preview'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {client} from 'lib/sanity.client'

const PreviewDocumentsCount = lazy(() => import('components/PreviewDocumentsCount'))

export const getStaticProps = async ({preview = false}) => {
  const data = await client.fetch(query)

  return {props: {preview, data}}
}

export default function IndexPage({preview, data}) {
  if (preview) {
    return (
      <PreviewSuspense fallback={<DocumentsCount data={data} />}>
        <PreviewDocumentsCount />
      </PreviewSuspense>
    )
  }
  return <DocumentsCount data={data} />
}
```

#### `createCurrentUserHook` is removed

If you used this hook to check if the user is cookie authenticated:

```tsx
import {createCurrentUserHook} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const useCurrentUser = createCurrentUserHook({projectId})
const useCheckAuth = () => {
  const {data, loading} = useCurrentUser()
  return loading ? false : !!data
}

export default function Page() {
  const isAuthenticated = useCheckAuth()
}
```

Then you can achieve the same functionality using `@sanity/preview-kit` and `suspend-react`:

```tsx
import {suspend} from 'suspend-react'
import {_checkAuth} from '@sanity/preview-kit'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const useCheckAuth = () =>
  suspend(() => _checkAuth(projectId, null), ['@sanity/preview-kit', 'checkAuth', projectId])

export default function Page() {
  const isAuthenticated = useCheckAuth()
}
```

### From `v0.4`

#### `createPortableTextComponent` is removed

This utility used to wrap `@sanity/block-content-to-react`. It's encouraged to upgrade to `@portabletext/react`.

```sh
$ npm install @portabletext/react
// or
$ yarn add @portabletext/react
```

```diff
-import { createPortableTextComponent } from 'next-sanity'
+import { PortableText as PortableTextComponent } from '@portabletext/react'

-export const PortableText = createPortableTextComponent({ serializers: {} })
+export const PortableText = (props) => <PortableTextComponent components={{}} {...props} />
```

Please note that the `serializers` and `components` are not 100% equivalent.

[Check the full migration guide.](https://github.com/portabletext/react-portabletext/blob/main/MIGRATING.md)

#### `createImageUrlBuilder` is removed

This utility is no longer wrapped by `next-sanity` and you'll need to install the dependency yourself:

```sh
$ npm install @sanity/image-url
// or
$ yarn add @sanity/image-url
```

```diff
-import { createImageUrlBuilder } from 'next-sanity'
+import createImageUrlBuilder from '@sanity/image-url'
```

## Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/next-sanity/actions/workflows/ci.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

MIT-licensed. See [LICENSE](LICENSE).
