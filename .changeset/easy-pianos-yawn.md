---
'next-sanity': patch
---

Don't call `draftMode()` in `<SanityLive>` if no `browserToken` is set

Without a `browserToken` then `includeDrafts` won't have an effect, so there's no need to call `draftMode()` in that case.
