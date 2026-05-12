---
'next-sanity': major
---

Remove the deprecated `fetchOptions` option from `defineLive`

This option was used to set a [time-based revalidation](https://nextjs.org/docs/app/guides/caching-without-cache-components#time-based-revalidation) as a fallback strategy for when content might change in the dataset without an active browser session connected to `<SanityLive>`, thus making the cached content stale.
The downside to this approach was that time-based revalidation ended up causing many unnecessary ISR writes, since they trigger based on a fixed interval rather than on the actual content changes.

Now that we have [Invalidate Sync Tags support in Sanity Functions](https://www.sanity.io/docs/functions/sync-tag-function-quickstart), the preferred fallback approach is to use it to call a `/api/revalidate-tags` endpoint in your app so that the content is eventually fresh even if the content change happened without an active browser session connected to `<SanityLive>`.
