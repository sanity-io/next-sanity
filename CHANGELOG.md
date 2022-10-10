<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.5](https://github.com/sanity-io/next-sanity/compare/v0.8.4...v0.8.5) (2022-10-10)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#76](https://github.com/sanity-io/next-sanity/issues/76)) ([34b357c](https://github.com/sanity-io/next-sanity/commit/34b357c20c7db026374708cf2f2d4fe6e6cb83c2))
- set dev-preview peer dep to tag ([b06996e](https://github.com/sanity-io/next-sanity/commit/b06996edc5aa66b7cff19d9e1f1bf7ede604bfc9))
- **studio:** set default font-family ([706c17f](https://github.com/sanity-io/next-sanity/commit/706c17fbcb46eac563f21c5cbb125c78d0c1f3a3))

## [0.8.4](https://github.com/sanity-io/next-sanity/compare/v0.8.3...v0.8.4) (2022-08-28)

### Bug Fixes

- support `sanity@dev-preview.15` ([98d50e2](https://github.com/sanity-io/next-sanity/commit/98d50e2c9f372bf7381725760f34a85dbcfbd183))

## [0.8.3](https://github.com/sanity-io/next-sanity/compare/v0.8.2...v0.8.3) (2022-08-28)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^3.3.5 ([#73](https://github.com/sanity-io/next-sanity/issues/73)) ([a52ea74](https://github.com/sanity-io/next-sanity/commit/a52ea74b752e94986995e54e810db2bcc7b1a5e8))

## [0.8.2](https://github.com/sanity-io/next-sanity/compare/v0.8.1...v0.8.2) (2022-08-20)

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to ^0.4.1 ([#71](https://github.com/sanity-io/next-sanity/issues/71)) ([467e110](https://github.com/sanity-io/next-sanity/commit/467e1103c4a3fe87124db6af50f1ad0cf6e8f068))

## [0.8.1](https://github.com/sanity-io/next-sanity/compare/v0.8.0...v0.8.1) (2022-08-17)

### Bug Fixes

- use `@sanity/semantic-release-preset` ([8dec077](https://github.com/sanity-io/next-sanity/commit/8dec077247d2d037f04e5e0fedbdd30c13e96f30))

## 0.5.2 - 2022-04-05

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
