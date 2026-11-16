---
'next-sanity': patch
---

fix(image): rotate the fill `object-position` with `queryParams.or`. The CDN turns the cropped image clockwise after any flip, so `90`, `180`, and `270` now move the hotspot the same way. `style.objectPosition` and the `objectPosition` prop still override it.
