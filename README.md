# next-sanity<!-- omit in toc -->

[Sanity.io](https://www.sanity.io/?utm_source=github&utm_medium=readme&utm_campaign=next-sanity) toolkit for Next.js.

**Features:**

- Client-side live real-time preview for authenticated users
- GROQ syntax highlighting
- [Embed](#next-sanitystudio-dev-preview) [Studio v3](https://www.sanity.io/studio-v3) in [Next.js](https://nextjs.org/) apps

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Live real-time preview](#live-real-time-preview)
  - [Limits](#limits)
- [Optimizing bundle size](#optimizing-bundle-size)
- [Usage](#usage)
- [Example: Minimal blog post template](#example-minimal-blog-post-template)
- [`next-sanity/studio` (dev-preview)](#next-sanitystudio-dev-preview)
  - [Usage](#usage-1)
  - [Opt-in to using `StudioProvider` and `StudioLayout`](#opt-in-to-using-studioprovider-and-studiolayout)
  - [Customize `<ServerStyleSheetDocument />`](#customize-serverstylesheetdocument-)
  - [Full-control mode](#full-control-mode)
- [Migrate](#migrate)
  - [From `v0.4`](#from-v04)
    - [`createPortableTextComponent` is removed](#createportabletextcomponent-is-removed)
    - [`createImageUrlBuilder` is removed](#createimageurlbuilder-is-removed)
- [License](#license)

## Installation

```sh
$ npm install next-sanity @portabletext/react @sanity/image-url
// or
$ yarn add next-sanity @portabletext/react @sanity/image-url
```

## Live real-time preview

You can implement real-time client side preview using `createPreviewSubscriptionHook`. It works by streaming the whole dataset to the browser, which it keeps updated using [listeners](https://www.sanity.io/docs/realtime-updates) and Mendoza patches. When it receives updates, then the query is run against the client-side datastore using [groq-js](https://github.com/sanity-io/groq-js). This only happens if you're logged in and the hook is configured to run, which means you can use this code in production.

You might want to use Vercel’s approach to previews, which is set up with a serverless functions that takes a preview secret, which in turn redirects you to a page with a `preview` prop set to `true`.

### Limits

The real-time preview isn't optimized and comes with a configured limit of 3000 documents. You can experiment with larger datasets by configuring the hook with `documentLimit: <Integer>`. Be aware that this might significantly affect the preview performance.

We have plans for optimizations in the roadmap.

## Optimizing bundle size

The first version of `next-sanity` shipped with the [`picosanity`](https://github.com/rexxars/picosanity) client built-in. This caused some confusion for people who not only want to pull data from their Sanity.io content lake, but also send patches and mutations via API routes. Since `picosanity` only supported fetching content, it had a smaller bundle size than the full SDK.

You can leverage Next.js' [tree shaking](https://developers.google.com/web/fundamentals/performance/optimizing-javascript/tree-shaking) to avoid shipping unnecessary code to the browser. In order to do so, you first need to isolate the client configuration in its own file, and be sure to only use it inside of the data fetching functions (`getStaticProps`, `getServerProps`, and `getStaticPaths`) or in the function that goes into the API routes (`/pages/api/<your-serverless-function>.js`).

You can follow the approach from the official Next.js preview example:

1. Make a `/lib` folder and add `config.js`, `sanity.js`, and `sanity.server.js` to it
2. In `/lib/config.js`, add and export the `projectId`, `dataset`, `apiVersion`, and other client configurations
3. In `/lib/sanity.js`, import and export the configurated helper functions that you need in the client-side code (like `urlFor`, `usePreviewSubscription`, and `PortableText`)
4. In `/lib/sanity.server.js`, create the client(s) you need for interacting with your content in the datafetching functions and in serverless API routes.

Should you want to do queries from the client side but want to avoid bundling the entire `@sanity/client`, you can of course still install and use [picosanity](https://github.com/rexxars/picosanity) manually.

## Usage

It’s practical to set up dedicated files where you import and set up your client etc. Below is a comprehensive example of the different things you can set up.

```js
// lib/config.js
export const config = {
  /**
   * Find your project ID and dataset in `sanity.json` in your studio project.
   * These are considered “public”, but you can use environment variables
   * if you want differ between local dev and production.
   *
   * https://nextjs.org/docs/basic-features/environment-variables
   **/
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: '2021-10-21', // Learn more: https://www.sanity.io/docs/api-versioning
  /**
   * Set useCdn to `false` if your application require the freshest possible
   * data always (potentially slightly slower and a bit more expensive).
   * Authenticated request (like preview) will always bypass the CDN
   **/
  useCdn: process.env.NODE_ENV === 'production',

  /**
   * OPTIONAL config to enable authentication with custom token
   * You might need this if you host the preview on a different url than Sanity Studio
   */
  token: '<sanity access token>',
  EventSource: /* provide your own event source implementation. Required in browsers to support the above token parameter. */
}
```

```js
// lib/sanity.js
import {createPreviewSubscriptionHook, createCurrentUserHook} from 'next-sanity'
import createImageUrlBuilder from '@sanity/image-url'
import {config} from './config'

/**
 * Set up a helper function for generating Image URLs with only the asset reference data in your documents.
 * Read more: https://www.sanity.io/docs/image-url
 **/
export const urlFor = (source) => createImageUrlBuilder(config).image(source)

// Set up the live preview subscription hook
export const usePreviewSubscription = createPreviewSubscriptionHook(config)

// Helper function for using the current logged in user account
export const useCurrentUser = createCurrentUserHook(config)
```

```js
// lib/sanity.server.js
import {createClient} from 'next-sanity'
import {config} from './config'

// Set up the client for fetching data in the getProps page functions
export const sanityClient = createClient(config)

// Set up a preview client with serverless authentication for drafts
export const previewClient = createClient({
  ...config,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Helper function for easily switching between normal client and preview client
export const getClient = (usePreview) => (usePreview ? previewClient : sanityClient)
```

## Example: Minimal blog post template

A minimal example for a blog post template using the schema from the Sanity Studio blog example. It includes the real-time preview using the configuration illustrated above:

```jsx
// pages/posts/[slug].js
import ErrorPage from 'next/error'
import {useRouter} from 'next/router'
import {groq} from 'next-sanity'
import {PortableText} from '@portabletext/react'
import {usePreviewSubscription, urlFor} from '../../lib/sanity'
import {getClient} from '../../lib/sanity.server'

const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    body,
    mainImage,
    categories[]->{
      _id,
      title
    },
    "slug": slug.current
  }
`

export default function Post({data, preview}) {
  const router = useRouter()

  const {data: post} = usePreviewSubscription(postQuery, {
    params: {slug: data.post?.slug},
    initialData: data.post,
    enabled: preview && data.post?.slug,
  })

  if (!router.isFallback && !data.post?.slug) {
    return <ErrorPage statusCode={404} />
  }

  const {title, mainImage, body} = post

  return (
    <article>
      <h2>{title}</h2>
      <figure>
        <img src={urlFor(mainImage).url()} />
      </figure>
      <PortableText value={body} />
    </article>
  )
}

export async function getStaticProps({params, preview = false}) {
  const post = await getClient(preview).fetch(postQuery, {
    slug: params.slug,
  })

  return {
    props: {
      preview,
      data: {post},
    },
  }
}

export async function getStaticPaths() {
  const paths = await getClient().fetch(
    groq`*[_type == "post" && defined(slug.current)][].slug.current`
  )

  return {
    paths: paths.map((slug) => ({params: {slug}})),
    fallback: true,
  }
}
```

## `next-sanity/studio` (dev-preview)

> [See it live](https://next.sanity.build/)

The latest version of Sanity Studio allows you to embed a near-infinitely configurable content editing interface into any React application. This opens up many possibilities:

- Any service that hosts Next.js apps can now host your Studio.
- Building previews for your content is easier as your Studio lives in the same environment.
- Use [Data Fetching](https://nextjs.org/docs/basic-features/data-fetching/overview) to configure your Studio.
- Easy setup of [Preview Mode](https://nextjs.org/docs/advanced-features/preview-mode).

### Usage

The basic setup is two files:

1. `pages/[[...index]].tsx`

```tsx
// Import your sanity.config.ts file
import config from '../sanity.config'
import {NextStudio} from 'next-sanity/studio'

export default function StudioPage() {
  // Loads the Studio, with all the needed neta tags and global CSS reqiired for it to render correctly
  return <NextStudio config={config} />
}
```

The `<NextStudio />` wraps `<Studio />` component and supports forwarding all its props:

```tsx
import {Studio} from 'sanity'
```

2. `pages/_document.tsx`

```tsx
import {ServerStyleSheetDocument} from 'next-sanity/studio'

// Set up SSR for styled-components, ensuring there's no missing CSS when deploying a Studio in Next.js into production
export default class Document extends ServerStyleSheetDocument {}
```

### Opt-in to using `StudioProvider` and `StudioLayout`

If you want to go lower level and have more control over the studio you can pass `StudioProvider` and `StudioLayout` from `sanity` as `children`:

```tsx
import {NextStudio} from 'next-sanity/studio'
import {StudioProvider, StudioLayout} from 'sanity'

import config from '../sanity.config'

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

### Customize `<ServerStyleSheetDocument />`

You can still customize `_document.tsx`, the same way you would the default `<Document />` component from `next/document`:

```tsx
import {ServerStyleSheetDocument} from 'next-sanity/studio'

export default class Document extends ServerStyleSheetDocument {
  static async getInitialProps(ctx: DocumentContext) {
    // You can still override renderPage:
    const originalRenderPage = ctx.renderPage
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => <App {...props} />,
      })

    const initialProps = await ServerStyleSheetDocument.getInitialProps(ctx)

    const extraStyles = await getStyles()
    return {
      ...initialProps,
      // Add to the default styles if you want
      styles: [initialProps.styles, extraStyles],
    }
  }
  render() {
    // do the same stuff as in `next/document`
  }
}
```

### Full-control mode

If you only need parts of what `<NextStudio />` does for you, but not all of it.
No problem. You can import any which one of the components that `<NextStudio />` is importing and assemble them in any way you want.

```tsx
import {Studio, type Config} from 'sanity'
import {NextStudioGlobalStyle, NextStudioHead} from 'next-sanity/studio'
// This implementation will only load the bare minimum of what's required for the Studio to render correctly. No favicons, fancy <meta name="theme-color"> tags or the like
export default function CustomNextStudio({config}: {config: Config}) {
  return (
    <>
      <Studio config={config} />
      <NextStudioHead>{/* Custom extra stuff in <head> */}</NextStudioHead>
      <NextStudioGlobalStyle />
    </>
  )
}
```

And while `<NextStudio />` have all features enabled by default allowing you to opt-out by giving it props, the inner components `<NextStudioHead />` and `<NextStudioGlobalStyle />` are opt-in.
This means that these two `StudioPage` components are functionally identical:

```tsx
import {
  NextStudio,
  NextStudioGlobalStyle,
  NextStudioHead,
  useThem,
  useBackgroundColorsFromTheme,
} from 'next-sanity/studio'
import {Studio} from 'sanity'
import config from '../sanity.config'

// Turning all the features off, leaving only bare minimum required meta tags and styling
function StudioPage() {
  return (
    <NextStudio
      config={config}
      // an empty string turns off the CSS that sets a background on <html>
      unstable__bg=""
      unstable__noTailwindSvgFix
      unstable__noFavicons
      // an empty string turns off the <title> tag
      unstable__document_title=""
    />
  )
}

// Since no features are enabled it works the same way
function Studiopage() {
  const theme = useTheme(config)
  const {themeColorLight, themeColorDark} = useBackgroundColorsFromTheme(theme)

  return (
    <>
      <Studio config={config} />
      <NextStudioHead themeColorLight={themeColorLight} themeColorDark={themeColorDark} />
      <NextStudioGlobalStyle />
    </>
  )
}
```

## Migrate

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

## License

MIT-licensed. See [LICENSE](LICENSE).
