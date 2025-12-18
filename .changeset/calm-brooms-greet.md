---
'next-sanity': patch
---

Simplify Sanity Live cache tag handling to use a single `cacheTagPrefix` across published and draft flows.

`parseTags()` now follows the single-prefix model and includes `tagsWithoutPrefix` as a convenience in the parsed result.
