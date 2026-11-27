---
'next-sanity': major
---

Require `sanity@^7`. `NextStudio` now imports `Studio` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1`, as `sanity@7` no longer exports it from `sanity`. To render `StudioProvider` and `StudioLayout` as `NextStudio` children, import them from that entry too.
