---
'next-sanity': patch
---

Removed the experimental `SanityLiveStream` export from `defineLive`. While this is technically a breaking change, it does not follow semver as it was an experimental, undocumented API marked as `@alpha`. We will return with a different implementation in the future, once we've found an approach that works well with Next.js v16 and cache components.
