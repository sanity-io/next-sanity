---
"next-sanity": major
---

Require Node.js 22.12, Next.js 16.3, `@sanity/client` v8, and Sanity Studio v6

`next-sanity` v14 raises its minimum versions to match the rest of the Sanity toolchain. Check each item below against your project before you upgrade.

**Node.js 22.12 or later.** The `engines.node` field is now `>=22.12`, the same range as `sanity`, `@sanity/client`, and `@portabletext/react`. Node.js 20 reached end of life in April 2026 and is no longer supported. The published bundle targets Node.js 22.12. Older runtimes are untested.

**Next.js 16.3 or later.** The `next` peer range is now `^16.3.0`. pnpm resolves `16.4.0-canary.15` against it without a peer warning. Under strict semver, prereleases of later minors fall outside the range, as they did for the v13 range `^16.0.0-0`.

**`@sanity/client` v8.** The dependency and the peer range are now `^8.0.0`. `next-sanity` re-exports `createClient` and the client types, so `createClient` options you pass through `next-sanity` must follow the v8 API. The [`@sanity/client` v8.0.0 release notes](https://github.com/sanity-io/client/releases/tag/v8.0.0) list every removed option. The ones most projects hit are the `requester` config option, the per-request `proxy` option, and the `HttpRequestEvent`, `ResponseEvent`, and `ProgressEvent` types. Move a custom requester to a custom `fetch` and `headers`. Set `proxy` on the client instead of per request.

**Sanity Studio v6 alongside `next-sanity`.** `next-sanity` v14 no longer declares a `sanity` peer dependency, because the studio entry points are gone. An app that embeds a Studio next to `next-sanity` installs `sanity` v6 itself.

**`@portabletext/react` v8.** `next-sanity` re-exports `@portabletext/react`, so `<PortableText />` rendering changes with it. Lists now nest as deeply as each block's `level` says. Content that starts a list deeper than level 1, or that skips levels, renders extra nested `<li>` wrappers instead of separate lists. Update snapshot tests over such content. The [`@portabletext/react` v8.0.0 release notes](https://github.com/portabletext/react-portabletext/releases/tag/v8.0.0) show the before and after markup and a CSS rule that hides the empty markers.

Before:

```json
{
  "engines": {"node": ">=20.19"},
  "dependencies": {
    "@sanity/client": "^7.26.2",
    "next": "^16.0.0",
    "next-sanity": "^13.0.0",
    "sanity": "^5.29.0"
  }
}
```

After:

```json
{
  "engines": {"node": ">=22.12"},
  "dependencies": {
    "@sanity/client": "^8.5.0",
    "next": "^16.3.0",
    "next-sanity": "^14.0.0",
    "sanity": "^6.0.0"
  }
}
```
