---
"next-sanity": patch
---

fix: recover draft mode with the Storage Access API when browsers reject `Partitioned` cookies in cross-site Presentation iframes (Firefox Enhanced Tracking Protection)

`defineEnableDraftMode` now verifies that the browser actually stored the draft-mode cookies before redirecting to the preview. When they were rejected (for example Firefox with Enhanced Tracking Protection configured to block all third-party cookies logs `Cookie "__prerender_bypass" has been rejected as third-party` even with the CHIPS `Partitioned` attribute), the route serves an interstitial inside the Presentation iframe that requests unpartitioned cookie access through `document.requestStorageAccess()` and retries, instead of silently redirecting to a preview that can never enter draft mode. Requests carrying `Sec-Fetch-Storage-Access: inactive` are retried with the already-granted permission activated (Storage Access Headers), and `<VisualEditing>` re-activates an existing grant per document so RSC requests and server actions keep sending the cookies. When the browser refuses storage access altogether, the interstitial explains how to unblock the preview (allow cross-site cookies for the Studio, or open the preview in a new tab) rather than failing with "Unable to connect to visual editing".
