---
"next-sanity": patch
---

fix(deps): update dependency @sanity/client to ^7.26.1

`@sanity/client@7.26.1` stops `StegaBranded` from branding symbol-keyed properties like the `internalGroqTypeReferenceTo` marker Sanity TypeGen puts on dereferenced references. Stega-branded `sanityFetch` data is now assignable to clean-typed props (like TypeGen query result types) whenever the real string fields are plain `string`, without `stegaClean`.
