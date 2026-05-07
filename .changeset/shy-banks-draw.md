---
'next-sanity': minor
---

Refactor `usePresentationQuery` to use `<VisualEditing />` as the provider, instead of `<SanityLive />`

`usePresentationQuery` now only requires `<VisualEditing />`; `<SanityLive />` is no longer needed on the page.
