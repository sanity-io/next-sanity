---
'next-sanity': minor
---

Add support for `cacheComponents: true` with `defineLive`

The `sanity-live-cache-components` skill can drive the migration with an agent. For best results, set up [`AGENTS.md`](https://nextjs.org/docs/app/guides/ai-agents#existing-projects) first.

```bash
npx skills add https://github.com/sanity-io/next-sanity --skill sanity-live-cache-components
```

Suggested prompt:

```txt
Use the /sanity-live-cache-components skill to migrate this app to use Cache Components. When verifying with `next dev`, test both draft mode enabled and draft mode disabled because each mode has different rendering rules. `next build --debug-prerender` is not sufficient to verify that draft mode works correctly.
```
