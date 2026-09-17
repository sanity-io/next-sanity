---
"next-sanity": patch
---

fix(image): make `imageLoader` callable in Server Components. The `'use client'` directive on the module entry turned it into a client reference, breaking the `getImageProps` composition pattern (e.g. art-directed `<picture>` elements) in Server Components. The directive now only applies to the `Image` component.
