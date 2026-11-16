---
'next-sanity': patch
---

fix(image): default `object-position` to the hotspot when `fill` is set. An image object with a hotspot now anchors the browser crop on that point (`75% 25%` for `x: 0.75, y: 0.25`), shifted so it stays aligned with the Studio crop the CDN serves. A point outside the crop is pinned to the nearest edge, and a `flip` query param (`h`, `v`, `hv`) is mirrored. `style.objectPosition` and the `objectPosition` prop still override it.
