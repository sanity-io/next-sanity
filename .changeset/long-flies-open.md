---
'next-sanity': major
---

Removed the deprecated `tag` option from `sanityFetch`, use `requestTag` instead.

The `requestTag` option ties into the `requestTagPrefix` option on `client` and [request log filtering in Sanity Content Lake](https://www.sanity.io/docs/platform-management/reference-api-request-tags). The old `tag` name is easy to confuse with `sanityFetch({tags})`, which forwards `fetch(url, {next: {tags}})` from [Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags).
