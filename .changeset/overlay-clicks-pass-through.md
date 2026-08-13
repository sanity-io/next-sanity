---
"next-sanity": patch
---

fix: allow Next.js `<Link>` clicks inside Presentation overlays

Visual Editing used to `preventDefault()` and `stopPropagation()` on capture-phase clicks for hovered `data-sanity` nodes in the preview iframe. Next.js `<Link>` treats a cancelled event as already handled and skips client navigation, which forced apps into capture-phase `router.push` workarounds.

Overlays now report `element/click` without cancelling the event. Clicks on registered content nodes no longer count as an overlay blur. This is applied via a patched `@sanity/visual-editing@6.0.1` until the same change ships upstream.
