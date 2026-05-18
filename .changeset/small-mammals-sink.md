---
'next-sanity': minor
---

Add opt-in strict mode to `defineLive` that helps with adopting cache components. It splits the migration into two PRs:

1. Add `strict: true` to `defineLive` and refactor `sanityFetch` and `<SanityLive>` sites to comply with the stricter requirements.
2. Add `cacheComponents: true` to the `next.config.ts` file, and add `'use cache'` to the functions that call `sanityFetch`.

If you don't plan on migrating to cache components, then you don't need to enable strict mode. If you do plan on migrating to cache components, but you don't use Visual Editing features or Presentation Tool in your studio, then you don't need to enable strict mode.
