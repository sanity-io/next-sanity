---
"next-sanity": patch
---

Fixed `.js`-suffixed bare imports (e.g. `next/headers.js`) in build output that broke Turbopack module resolution in app-route handlers
