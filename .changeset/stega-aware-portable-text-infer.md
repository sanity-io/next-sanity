---
"next-sanity": patch
---

fix: accept stega branded `sanityFetch` data in `<PortableText>` `Infer*` types

The `InferValue`, `InferComponents` and `InferStrictComponents` types re-exported from the main `next-sanity` entry are now stega-aware. They shadow the `@portabletext/react` versions and widen the inferred types to cover both the clean TypeGen shape (`sanityFetch` with `stega: false`) and the stega-branded shape that `sanityFetch` returns when stega may be enabled (introduced in `next-sanity@13.3.0`).

Re-usable components typed with `InferValue` no longer fail to type-check when given stega-branded data:

```tsx
import {PortableText, type InferStrictComponents, type InferValue, type SanityQueries} from 'next-sanity'

export function CustomPortableText(props: {value: InferValue<SanityQueries[keyof SanityQueries]>}) {
  const components = {
    // …
  } satisfies InferStrictComponents<typeof props.value>
  return <PortableText components={components} value={props.value} />
}
```

Previously the branded data had to be cleaned wholesale (`value={stegaClean(props.value)}`), which strips the hidden characters `@sanity/visual-editing` uses to make each paragraph clickable in Visual Editing. Strings inside component handler props stay branded, keep rendering them as-is and use `stegaClean` on the individual values you compare against string literals.
