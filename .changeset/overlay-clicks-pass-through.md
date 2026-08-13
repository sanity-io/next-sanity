---
"next-sanity": minor
---

fix(deps): update dependency @sanity/visual-editing to ^6.0.4

Presentation overlays no longer cancel every hovered `data-sanity` click. Modifier clicks, overlays-off, and the "Open in Studio" path leave the event alone so Next.js `<Link>` can client-navigate without capture-phase `router.push` workarounds.

This release also updates the documented Node.js requirement to `>=22.12`, matching `@sanity/visual-editing` v6 and Sanity v6.

> [!WARNING]
> This is a breaking change for projects running `next-sanity` on Node.js 20. Upgrade to Node.js 22.12 or later before updating.
