---
"next-sanity": patch
---

fix: stop `<SanityLive />` from writing `BAILOUT_TO_CLIENT_SIDE_RENDERING` markers into prerendered HTML

The `SanityLive` client component wrapper no longer uses `next/dynamic` with `ssr: false`, which works by throwing a `BailoutToCSRError` during server rendering and leaves a `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` marker (an empty, client-rendered suspense boundary) in otherwise fully prerendered HTML. It now lazy loads the live event machinery with `React.lazy` after hydration instead, preserving the `ssr: false` characteristics: `@sanity/client` and the rest of the live machinery stay in a separate chunk that is only downloaded in the browser, and only if `<SanityLive />` actually renders.
