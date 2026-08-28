---
"next-sanity": patch
---

fix(image): pass `data:` and `blob:` srcs through untouched. They render unoptimized, like in `next/image`, instead of being corrupted by appended CDN params.
