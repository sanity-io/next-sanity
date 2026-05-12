---
'next-sanity': major
---

Remove the `stega` option from `defineLive`

When the `client` given to `defineLive` has a `stega.studioUrl` configured, and `draftMode().isEnabled` is `true`, then `sanityFetch` calls would use `true` as the default value for its `stega` option.

To opt-out of `stega` being set by default in draft mode, you have 3 options:

1. Do not define `stega.studioUrl` in the `client` config
2. Set `stega: false` in the `sanityFetch` call itself
3. Set `stega: false` in the `defineLive` call.

With this change you no longer have option 3, and you have to use option 2 or 1.
