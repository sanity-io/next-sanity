---
"next-sanity": minor
---

feat: brand `sanityFetch` data with stega string types

`defineLive().sanityFetch` now types `data` with the stega branded string types introduced in `@sanity/client@7.25.0`:

- `stega: true` → `data` is `StegaBranded<ClientReturn<...>>`, so comparing possibly stega-encoded strings to literals is a compile error until cleaned with `stegaClean`
- `stega: false` → `data` keeps clean TypeGen / `ClientReturn` types
- `stega` as a non-literal `boolean`, or omitted → `data` is conservatively branded

`stegaBrand` and the `ClientReturnStega`, `StegaBranded`, `StegaString`, and `StegaCleaned` types are now re-exported from the main `next-sanity` entry, alongside the existing `stegaClean` export.
