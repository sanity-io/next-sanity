> [!CAUTION]
> The experimental `next-sanity/experimental/live` API is not yet stable and could have breaking changes in future minor releases.
> It requires `cacheComponents` to be enabled in your `next.confict.ts`, which was introduced in [`next@16.0.0`](https://nextjs.org/blog/next-16#cache-components).

# Setup

See the personal website template for a working example:

- [Code](https://github.com/sanity-io/template-nextjs-personal-website/tree/test-cache-components)
- [Demo](https://template-nextjs-personal-website-git-test-cache-components.sanity.dev/)

```diff
// ./src/lib/sanity/live.ts
-import {defineLive} from 'next-sanity/live'
+import {defineLive} from 'next-sanity/experimental/live'
```

```diff
// ./next.config.ts

export default {
+  cacheComponents: true,
}
```

## API Differences from `next-sanity/live`

### `defineLive` options

These options are removed:

- `fetchOptions.revalidate` - caching is now controlled by an underlying `cacheLife` call, instead of as the `next.revalidate` option on a `fetch`. The options given to `cacheLife` might be configurable in the future.
- `stega` - stega on/off is now controlled by the `sanityFetch` call itself, so there's no need for a global option.

### `sanityFetch` options

The deprecated `tag` is removed, use `requestTag` instead.

The `stega` and `perspective` options are no longer automatically resolved, you need to pass them explicitly.
By default `stega` is `false` and `perspective` is `'published'`.

In order to recreate the behavior of `next-sanity/live`, which includes resolving the preview perspective from a cookie, you can do something like this:

```tsx
// src/sanity/lib/live.ts

import {createClient} from 'next-sanity'
import {defineLive,resolvePerspectiveFromCookies,type SanityFetchOptions,} from 'next-sanity/experimental/live'

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

const {sanityFetch: _sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

// Automatically fetches draft content with the right preview perspective in draft mode, and enables stega for visual editing overlays
const sanityFetch = async <const QueryString extends string>({
  query,
  params,
}: Pick<SanityFetchOptions<QueryString>, 'query' | 'params'>) => {
  const isDraftMode = (await draftMode()).isEnabled
  const perspective = isDraftMode
    ? await resolvePerspectiveFromCookies({cookies: await cookies()})
    : 'published'

  return _sanityFetch({query, params, perspective, stega: isDraftMode})
}

// Fetches content for use in generateMetadata, generateViewport and such, which may have draft content but perspective switching isn't necessary and stega should never be enabled
const sanityFetchMetadata = async <const QueryString extends string>({
  query,
  params,
}: Pick<SanityFetchOptions<QueryString>, 'query' | 'params'>)=> {
  const isDraftMode = (await draftMode()).isEnabled
  const perspective = isDraftMode
    ? await resolvePerspectiveFromCookies({cookies: await cookies()})
    : 'published'
  return _sanityFetch({query, params, perspective, stega: false})
}

// Fetches content for generateStaticParams, which only happens at build time and should only fetch published content
const sanityFetchStaticParams = = async <const QueryString extends string>({
  query,
  params,
}: Pick<SanityFetchOptions<QueryString>, 'query' | 'params'>)=> {
  return _sanityFetch({query, params, perspective: 'published', stega: false})
}

export {sanityFetch, sanityFetchMetadata, sanityFetchStaticParams, SanityLive}
```
