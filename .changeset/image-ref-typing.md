---
"next-sanity": patch
---

fix(image): type the `ref` prop on `Image`. It was already forwarded to the underlying `<img>` element at runtime, but TypeScript rejected it.
