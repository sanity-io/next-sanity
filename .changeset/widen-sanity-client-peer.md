---
"next-sanity": patch
---

Allow `@sanity/client` v8 as a peer while keeping v7. The installed dependency stays on v7, and `engines.node` is unchanged, so Node 20 apps are still valid.

`next-sanity` no longer re-exports `unstable__adapter` and `unstable__environment`. Those names were always marked unstable and are not covered by semver. Client v8 removed them. Importing them from `next-sanity` will fail after this release on both v7 and v8.
