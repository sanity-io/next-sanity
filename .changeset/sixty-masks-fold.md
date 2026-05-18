---
"next-sanity": major
---

Change `sanityFetch` in `cacheComponents: false` mode to stop caching the internal sync-tag lookup request.

Sanity Live uses Content Lake `syncTags` to revalidate cached routes when documents change. When `cacheComponents: true` is enabled, `sanityFetch` can perform a single Content Lake request: the response includes `syncTags`, and Next.js exposes `cacheTag()` so those response-derived tags can be added to the cache entry before it is stored.

When `cacheComponents: false`, Next.js requires cache tags to be known before the cached fetch is made, regardless of whether the result is cached with [`fetch(url, {next: {tags}})`](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags) or [`unstable_cache()`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache). To make Sanity Live revalidation work without requiring custom tag naming conventions, `sanityFetch` uses two Content Lake requests in this mode: one request to discover the `syncTags` for the query, and one request for the actual result using those precise `syncTags` as Next.js cache tags. The sync-tag lookup request does not count toward Sanity API usage quotas.

Previously both requests used the Next.js fetch cache, but the sync-tag lookup shared a broad `sanity:fetch-sync-tags` tag across all queries and params. That could let the discovered `syncTags` drift over time as documents gained new references.

In next-sanity v12, the default `revalidateSyncTags` prop implementation on `<SanityLive />` called `revalidateTag('sanity:fetch-sync-tags', 'max')` for that broad lookup tag, marking those routes as stale and letting them follow Next.js stale-while-revalidate semantics. Actual content sync tags were expired with `revalidateTag(tag, {expire: 0})`, so only routes whose content changed were guaranteed fresh with `CACHE: REVALIDATED` instead of serving stale content. In next-sanity v13, the equivalent default `action` implementation no longer calls `revalidateTag('sanity:fetch-sync-tags', 'max')` because sync-tag lookup requests are not cached, so there is no broad lookup tag to expire and no sync-tag drift.

The sync-tag lookup request now bypasses the Next.js fetch cache, so only the second request with precise `next.tags` is cached. For statically generated routes this should usually behave the same, because the route output can still be cached even though the lookup request is not. Fully dynamic routes that rely on the fetch cache may see the first request hit the Sanity API CDN on each render. That first request still does not count toward Sanity API usage quotas, but it can add latency.

If that extra dynamic-route latency matters, either opt in to `cacheComponents: true` and use the `use cache: remote` directive, or call `client.fetch()` directly on those routes and provide your own cache tags and revalidation options:

```ts
client.fetch(query, params, {
  next: {revalidate: 15, tags: ['custom-revalidation-tag']},
})
```
