---
"next-sanity": patch
---

fix(deps): update dependency @sanity/visual-editing to ^6.0.4

Presentation overlays no longer cancel every hovered `data-sanity` click. Modifier clicks, overlays-off, and the "Open in Studio" path leave the event alone so Next.js `<Link>` can client-navigate without capture-phase `router.push` workarounds.
