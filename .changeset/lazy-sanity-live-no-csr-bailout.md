---
"next-sanity": patch
---

fix: stop `<SanityLive />` from writing `BAILOUT_TO_CLIENT_SIDE_RENDERING` markers into prerendered HTML

The `SanityLive` client component wrapper no longer renders its `next/dynamic` (`ssr: false`) component during server rendering, where it throws a `BailoutToCSRError` and leaves a `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` marker (an empty, client-rendered suspense boundary) in otherwise fully prerendered HTML. The dynamic component is now gated behind a mount check so it only renders in the browser, after hydration, where `next/dynamic` doesn't throw. `next/dynamic` is still used for its bundle optimizations: `@sanity/client` and the rest of the live machinery stay in a separate chunk that is only downloaded if `<SanityLive />` actually renders.
