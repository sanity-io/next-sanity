> [!CAUTION]
> The experimental `next-sanity/experimental/live` API is not yet stable and could have breaking changes in future minor releases.
> It currently requires `experimental.cacheComponents` to be enabled in your `next.confict.ts`, which is currently ( as of Sept 2025) only available on `next@canary`.
> There's no guarantee that it will work with `next@16` or in future prereleases of `next@canary`.

# Setup

See the personal website template for a working example:

- [Code](https://github.com/sanity-io/template-nextjs-personal-website/tree/test-cache-components)
- [Demo](https://template-nextjs-personal-website-git-test-cache-components.sanity.dev/)

```diff
// ./src/lib/sanity/live.ts
-import {defineLive} from 'next-sanity/experimental/live'
+import {defineLive} from 'next-sanity/live'
```

```diff
// ./next.config.ts

+ experimental: {
+   cacheComponents: true,
+    cacheLife: {
+      default: {
+       // Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
+       revalidate: 60 * 60 * 24 * 90, // 90 days
+      },
+   },
+ },
```

## API Differences from `next-sanity/live`

`defineLive({stega})` is no longer `true` by default.
If you have `stega.studioUrl` set in your client configuration, then `stega` defaults to `true`, otherwise it defaults to `false`.

## Studio perspective switching does not work out of the box

In `next-sanity/live`, the Studio perspective switching works out of the box, because we can use the `import {cookies} from 'next/headers'` API when in Draft Mode to read the studio perspective from a cookie and then use it in the `sanityFetch` call.

In `next-sanity/experimental/live` and `cacheComponents` it's not allowed to call `await cookies()` from a function that has a parent `'use cache'` directive.
