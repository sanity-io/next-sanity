---
"next-sanity": minor
---

Add editing variant support: persist the variant selected in the Presentation tool in a `sanity-preview-variant` cookie (via `defineEnableDraftMode` and the new `variantChangeAction` wired to `onVariantChange`), resolve it with the new `resolveVariantFromCookies` helper, and pass the new `variant` option through `sanityFetch` to `client.fetch` so previews refetch with the selected variant.
