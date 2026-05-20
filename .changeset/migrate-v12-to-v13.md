---
'next-sanity': major
---

See the [v12 -> v13 migration guide](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md) for full details and code snippets.

- Default cache-invalidation behavior changed: `revalidateSyncTags` on `<SanityLive>` is replaced by `action`, and `sanityFetch` no longer caches the internal sync-tag lookup when `cacheComponents: false`.
- Removed `<SanityLive>` props that were on by default: `refreshOnFocus`, `refreshOnReconnect`.
- Removed opt-in `<SanityLive>` / `defineLive` props: `refreshOnMount`, `intervalOnGoAway` (and `onGoAway` signature changed), `fetchOptions`, `stega`.
- Removed deprecated hooks: `useDraftModePerspective`, `useIsLivePreview`, `useDraftModeEnvironment`.
- Removed deprecated `tag` option on `sanityFetch` and `tag` prop on `<SanityLive>` (use `requestTag`).
- Renamed `next-sanity/live` type exports: `DefinedSanityFetchType` -> `DefinedFetchType`, `DefinedSanityLiveProps` -> `DefinedLiveProps`, `DefineSanityLiveOptions` -> `DefineLiveOptions`.
