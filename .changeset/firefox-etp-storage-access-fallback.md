---
"next-sanity": patch
---

fix: Presentation draft mode when Firefox blocks third-party cookies

Firefox can reject the draft-mode cookies (`Cookie "…" has been rejected as third-party`), even when they are `Partitioned`. The preview then never entered draft mode. `defineEnableDraftMode` now asks for cookie access inside the preview, and tells you how to allow cookies for the Studio if the browser refuses.
