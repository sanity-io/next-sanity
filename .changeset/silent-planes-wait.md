---
'next-sanity': minor
---

Disallow using `defineLive` when `cacheComponents: true` is enabled.

Technically this is a breaking change for apps that currently combine `defineLive` with Next.js Cache Components. However, this configuration is not supported and can cause problems that are difficult to detect, so it is better to fail early until #3109 lands.
