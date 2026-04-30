---
"next-sanity": patch
---

Stop calling `prefetchDNS` from 'react-dom' in `<SanityLive>`, calling `preconnect` is enough
