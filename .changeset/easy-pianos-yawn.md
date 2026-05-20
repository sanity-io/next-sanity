---
'next-sanity': patch
---

Don't call `draftMode()` in `<SanityLive>` if no `browserToken` is set

Without a `browserToken`, `includeDrafts` has no effect, so there's no reason to call `draftMode()`.
