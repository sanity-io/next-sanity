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
- [Static params for dynamic routes](#static-params-for-dynamic-routes)
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
