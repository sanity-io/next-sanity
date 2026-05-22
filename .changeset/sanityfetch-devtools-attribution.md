---
'next-sanity': patch
---

Surface `sanityFetch` in React DevTools

In development builds, the Promise returned by `sanityFetch` is now tagged with React's `displayName` and `_debugInfo` so awaits are attributed to Sanity in:

- The Chrome DevTools Performance panel's **Server Requests** track, where entries are now labeled `sanityFetch` instead of being unnamed.
- The React DevTools Components inspector's **Suspended by** panel, both for Server Components that `await sanityFetch(...)` and for Client Components that consume the Promise via `use(props.promise)`.

The instrumentation is strictly DEV-only — production builds short-circuit and pay nothing — and the added properties are non-enumerable, so they don't leak into `console.log`, JSON serialization, or test snapshots.
