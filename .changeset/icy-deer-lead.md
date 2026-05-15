---
'next-sanity': patch
---

`sanityFetch` no longer calls `draftMode()` unless a `serverToken` is provided.

If no `serverToken` then there's no special handling of resolving `perspective` and `stega` options when in draft mode, so there's no need to call `draftMode()`, which can cause issues in certain environments.
