---
"next-sanity": minor
---

Add `includeDrafts` prop to `<SanityLive />`

When you pass `browserToken` to `defineLive`, `<SanityLive />` automatically sets [`client.live.events` `includeDrafts`](https://www.sanity.io/docs/apis-and-sdks/js-client-realtime#ccdcec9ba7c4) from `draftMode().isEnabled`. You can now override that by setting the `includeDrafts` prop directly.