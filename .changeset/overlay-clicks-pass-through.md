---
"next-sanity": minor
---

feat!: require Node.js 22.12 or later

`next-sanity` now documents `engines.node` as `>=22.12`, matching `@sanity/visual-editing` v6 and Sanity v6. Next.js 16 still allows Node.js 20, but this package's direct Visual Editing dependency does not.

> [!WARNING]
> This is a breaking change for projects running `next-sanity` on Node.js 20. Upgrade to Node.js 22.12 or later before updating.
