---
'next-sanity': minor
---

Add support for `cacheComponents: true` with `defineLive`

You can use the `sanity-live-cache-components` skill to opt-in to cache components using an agent (assuming you have [`AGENTS.md` setup for optimal next.js agent performance](https://nextjs.org/docs/app/guides/ai-agents#existing-projects)):

```bash
npx skills add https://github.com/sanity-io/next-sanity --skill sanity-live-cache-components
```

Prompt:

```txt
Use the /sanity-live-cache-components skill to migrate this app to use cache components. When verifying that the build works with `next dev` make sure you remember to test with draft mode enabled in nextjs as well as disabled as there are different rules for each mode, and running `next build --debug-prerender` is not enough to verify that draft mode works correctly.
```
