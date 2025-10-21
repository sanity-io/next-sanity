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

In order to recreate the behavior of `next-sanity/live`, you can do something like this:

## Studio perspective switching does not work out of the box

In `next-sanity/live`, the Studio perspective switching works out of the box, because we can use the `import {cookies} from 'next/headers'` API when in Draft Mode to read the studio perspective from a cookie and then use it in the `sanityFetch` call.

In `next-sanity/experimental/live` and `cacheComponents` it's not allowed to call `await cookies()` from a function that has a parent `'use cache'` directive.
