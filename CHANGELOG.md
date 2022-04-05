# Change Log

All notable changes will be documented in this file.

## 0.5.2

### Fixes

- Exports the `Aborter` interface used in `AbortController` to support stricter TypeScript setups.
- Allows stricter TypeScript setups by re-exporting `SanityClient` and `ClientConfig` from `@sanity/client`
- Bumps `@sanity/client` to `v3.3.0`, `@sanity/groq-store` to `v0.3.1` and `groq` to `v2.29.3`
- Typo in readme (#44)

## 0.5.1 - 2022-03-04

### Fixes

- Export the `SubscriptionOptions` interface in `useSubscription`

## 0.5.0 - 2022-02-16

### Features

- Upgraded `@sanity/groq-store` to `v0.3.0` which includes a new beta of `groq-js` that improves performance, especially when using projections.

### BREAKING

- Upgraded `@sanity/client` to `v3`, see its [CHANGELOG](https://github.com/sanity-io/client/blob/main/CHANGELOG.md#300) for details.
- `createPortableTextComponent` is removed.
- `createImageUrlBuilder` is removed.

See the [README](https://github.com/sanity-io/next-sanity#from-v04) for migration instructions.

## 0.4.0 - 2021-08-11

### BREAKING

- **Portable Text:** When encountering unknown block types, the serializer will no longer throw by default - instead if will render a hidden `div` with a message noting that a serializer is missing. A message will also be logged to the console. To use the old behavior of throwing on unknown types, pass `ignoreUnknownTypes: false` as a property to the `createPortableTextComponent()` function.
- **Portable Text:** The `markFallback` serializer has been renamed to `unknownMark` to align with the new `unknownType` serializer for blocks.
