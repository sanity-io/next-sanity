# next-sanity<!-- omit in toc -->

[Sanity.io](https://www.sanity.io/?utm_source=github&utm_medium=readme&utm_campaign=next-sanity) toolkit for Next.js.

**Features:**

- Client-side live real-time preview for Next 13 and `appDir`. For `pages`, or older versions of Next, you can use [`@sanity/preview-kit`](https://github.com/sanity-io/preview-kit).
- GROQ syntax highlighting
- [Embed](#next-sanitystudio-dev-preview) [Studio v3](https://www.sanity.io/studio-v3) in [Next.js](https://nextjs.org/) apps

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Live real-time preview](#live-real-time-preview)
  - [Limits](#limits)
- [`next-sanity/studio` (dev-preview)](#next-sanitystudio-dev-preview)
  - [Usage](#usage)
  - [Opt-in to using `StudioProvider` and `StudioLayout`](#opt-in-to-using-studioprovider-and-studiolayout)
  - [Customize `<ServerStyleSheetDocument />`](#customize-serverstylesheetdocument-)
  - [Full-control mode](#full-control-mode)
- [Migrate](#migrate)
  - [From `v0.4`](#from-v04)
    - [`createPortableTextComponent` is removed](#createportabletextcomponent-is-removed)
    - [`createImageUrlBuilder` is removed](#createimageurlbuilder-is-removed)
- [Release new version](#release-new-version)
- [License](#license)

## Installation

```sh
$ npm install next-sanity @portabletext/react @sanity/image-url
// or
$ yarn add next-sanity @portabletext/react @sanity/image-url
```

## Live real-time preview

You can implement real-time client side preview using `definePreview`. It works by streaming the whole dataset to the browser, which it keeps updated using [listeners](https://www.sanity.io/docs/realtime-updates) and Mendoza patches. When it receives updates, then the query is run against the client-side datastore using [groq-js](https://github.com/sanity-io/groq-js).

### Limits

The real-time preview isn't optimized and comes with a configured limit of 3000 documents. You can experiment with larger datasets by configuring the hook with `documentLimit: <Integer>`. Be aware that this might significantly affect the preview performance.

We have plans for optimizations in the roadmap.

## `next-sanity/studio` (dev-preview)

> [See it live](https://next.sanity.build/studio)

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
  // Loads the Studio, with all the needed meta tags and global CSS required for it to render correctly
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
  useTheme,
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

## Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/next-sanity/actions/workflows/ci.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

MIT-licensed. See [LICENSE](LICENSE).
