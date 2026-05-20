---
'next-sanity': patch
---

`sanityFetch` no longer calls `draftMode()` unless a `serverToken` is provided.

Without a `serverToken`, `perspective` and `stega` aren't adjusted for draft mode, so the `draftMode()` call is unnecessary and can cause issues in certain environments.
