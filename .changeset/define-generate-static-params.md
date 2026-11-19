---
'next-sanity': minor
---

feat: add `defineGenerateStaticParams`

`export const {generateStaticParams} = defineGenerateStaticParams({client, type: 'post'})` fetches the published documents of a type that have a slug, and returns them as `{slug}` params. When `AllSanitySchemaTypes` from `sanity typegen` is registered on the global `SanityTypegen` interface, `type` only accepts document types with a top-level `slug` field.
