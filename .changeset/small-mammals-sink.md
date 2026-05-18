---
'next-sanity': minor
---

Add opt-in `strict` mode to `defineLive` to ease cache components adoption by splitting the migration into two PRs:

1. Enable `strict: true` and update `sanityFetch` and `<SanityLive>` call sites to satisfy the stricter requirements.
2. Enable `cacheComponents: true` in `next.config.ts` and add `'use cache'` to functions that call `sanityFetch`.

You only need strict mode if you're migrating to cache components and use Visual Editing or Presentation Tool.
