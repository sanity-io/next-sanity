---
'next-sanity': major
---

### Breaking changes

This release contains multiple breaking changes. See the [migration guide](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md) for detailed instructions on how to handle each one.

#### Summary

- Replace the `revalidateSyncTags` prop on `<SanityLive>` with `action`
- `sanityFetch` sync-tag lookup request is no longer cached in `cacheComponents: false` mode
- Remove `refreshOnFocus` prop from `<SanityLive>`
- Remove `refreshOnReconnect` prop from `<SanityLive>`
- Remove `refreshOnMount` prop from `<SanityLive>`
- Remove `intervalOnGoAway` prop, change signature of `onGoAway`
- Remove the deprecated `fetchOptions` option from `defineLive`
- Remove the `stega` option from `defineLive`
- Renamed type exports: `DefinedSanityFetchType` → `DefinedFetchType`, `DefinedSanityLiveProps` → `DefinedLiveProps`, `DefineSanityLiveOptions` → `DefineLiveOptions`
- Remove the deprecated `tag` prop from `<SanityLive>` and `tag` option from `sanityFetch` (use `requestTag`)
- Remove the deprecated `useDraftModePerspective` hook
- Remove the deprecated `useDraftModeEnvironment` hook (use `useVisualEditingEnvironment`)
- Remove the deprecated `useIsLivePreview` hook
