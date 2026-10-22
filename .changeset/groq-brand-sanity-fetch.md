---
'next-sanity': minor
---

`sanityFetch` from `defineLive` now checks `params` against the params type of a branded GROQ query, such as the default export of a `.groq` file imported through `@sanity-labs/groq-content-mapper`, and infers `data` from its result type, with no generic argument and no `SanityQueries` entry. Plain strings, `defineQuery` and TypeGen `SanityQueries` registrations resolve as before.
