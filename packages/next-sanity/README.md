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
  - [Install `next-sanity`](#install-next-sanity)
  - [Optional: peer dependencies for embedded Sanity Studio](#optional-peer-dependencies-for-embedded-sanity-studio)
- [Sanity Live with Cache Components](#sanity-live-with-cache-components)
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
