---
'next-sanity': minor
---

Add opt-in `strict` mode to `defineLive` so cache-components migrations can be split across two PRs:

1. Enable `strict: true`, then update `sanityFetch` and `<SanityLive>` call sites to satisfy the new requirements.
2. Enable `cacheComponents: true` in `next.config.ts` and add `'use cache'` to functions that call `sanityFetch`.

Strict mode is only needed when migrating to cache components alongside Visual Editing or Presentation Tool.
