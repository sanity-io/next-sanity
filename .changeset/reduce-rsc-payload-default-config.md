---
'next-sanity': patch
---

Reduce the RSC payload for faster page loads by omitting `apiHost` and `useProjectHostname` from the client component props when they are set to their default values (`"https://api.sanity.io"` and `true`, respectively).
