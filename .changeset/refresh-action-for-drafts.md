---
'next-sanity': patch
---

Default `action` to `'refresh'` when `<SanityLive>` is given `includeDrafts`

When `includeDrafts` is enabled, using `revalidateSyncTagsAction` requires an unnecessary server round trip since draft content bypasses the cache anyway. This change makes the action default to `'refresh'` (a client-side `router.refresh()`) when `includeDrafts` is set, matching the existing behavior for `waitFor="function"`.

A custom `action` prop still takes precedence when provided.
