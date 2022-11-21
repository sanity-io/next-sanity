<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.1.0](https://github.com/sanity-io/next-sanity/compare/v2.0.2...v2.1.0) (2022-11-21)

### Features

- add `next-sanity/webhook` ([#180](https://github.com/sanity-io/next-sanity/issues/180)) ([5a94a9f](https://github.com/sanity-io/next-sanity/commit/5a94a9f47a5dd98d435bf6ee7b718b627c0b7ffa))

## [2.0.2](https://github.com/sanity-io/next-sanity/compare/v2.0.1...v2.0.2) (2022-11-18)

### Bug Fixes

- support `swcMinify` in NextJS 13 ([8e4ad34](https://github.com/sanity-io/next-sanity/commit/8e4ad34aef0defca0e36179d6d29ee46febd9083))

## [2.0.1](https://github.com/sanity-io/next-sanity/compare/v2.0.0...v2.0.1) (2022-11-16)

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to ^1.1.3 ([#172](https://github.com/sanity-io/next-sanity/issues/172)) ([77d4a98](https://github.com/sanity-io/next-sanity/commit/77d4a98b413737ffc0d20cf2064999a42891291a))
- **deps:** update dependency @sanity/preview-kit to ^1.2.7 ([#173](https://github.com/sanity-io/next-sanity/issues/173)) ([7d580d7](https://github.com/sanity-io/next-sanity/commit/7d580d7567819a0dc519aa1249c41a94aa123627))

## [2.0.0](https://github.com/sanity-io/next-sanity/compare/v1.1.0...v2.0.0) (2022-11-16)

### ⚠ BREAKING CHANGES

[Check the full migration guide for details.](https://github.com/sanity-io/next-sanity#from-v1)

- Requires Node `v16`, like `Next 13`.
- `createPreviewSubscriptionHook` is replaced with `definePreview`.
- `createCurrentUserHook` is removed

### Features

- add new preview mode for Next 13 ([#152](https://github.com/sanity-io/next-sanity/issues/152)) ([9eae92a](https://github.com/sanity-io/next-sanity/commit/9eae92a5c7f080e5c34c04f555135623be182a0a)), closes [#next-12](https://github.com/sanity-io/next-sanity/issues/next-12) [#65](https://github.com/sanity-io/next-sanity/issues/65) [#4](https://github.com/sanity-io/next-sanity/issues/4) [#8](https://github.com/sanity-io/next-sanity/issues/8) [#16](https://github.com/sanity-io/next-sanity/issues/16) [#53](https://github.com/sanity-io/next-sanity/issues/53) [#46](https://github.com/sanity-io/next-sanity/issues/46) [#35](https://github.com/sanity-io/next-sanity/issues/35) [#22](https://github.com/sanity-io/next-sanity/issues/22) [#154](https://github.com/sanity-io/next-sanity/issues/154)

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to ^1.1.1 (main) ([#159](https://github.com/sanity-io/next-sanity/issues/159)) ([13c6d93](https://github.com/sanity-io/next-sanity/commit/13c6d9385eb8b443be6a7ca71cbe20f636627e50))
- **deps:** update dependency @sanity/groq-store to ^1.1.2 (main) ([#165](https://github.com/sanity-io/next-sanity/issues/165)) ([4305d75](https://github.com/sanity-io/next-sanity/commit/4305d75a990f291442b74f79ce5686acf1d0cd09))
- support TS `v4.9.x` ([#162](https://github.com/sanity-io/next-sanity/issues/162)) ([0afc823](https://github.com/sanity-io/next-sanity/commit/0afc823dd93023199356195d8aca182e91a93a5f))

## [1.1.0](https://github.com/sanity-io/next-sanity/compare/v1.0.9...v1.1.0) (2022-11-15)

### Features

- add support for fetching subset of dataset by type ([#157](https://github.com/sanity-io/next-sanity/issues/157)) ([33b42d2](https://github.com/sanity-io/next-sanity/commit/33b42d2e63dd8ddc274c508ebedb927bdb8ecaef))

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to ^1.0.4 (main) ([#146](https://github.com/sanity-io/next-sanity/issues/146)) ([5043b01](https://github.com/sanity-io/next-sanity/commit/5043b011b0e0b290f01f763842b5ffae725271ce))

## [1.1.0-add-type-allowlist.1](https://github.com/sanity-io/next-sanity/compare/v1.0.9...v1.1.0-add-type-allowlist.1) (2022-11-14)

### Features

- add support for fetching subset of dataset by type ([8416e74](https://github.com/sanity-io/next-sanity/commit/8416e74a47bc4cd9a0ef8420228941a178c198ea))

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to ^1.0.4 (main) ([#146](https://github.com/sanity-io/next-sanity/issues/146)) ([5043b01](https://github.com/sanity-io/next-sanity/commit/5043b011b0e0b290f01f763842b5ffae725271ce))

## [1.0.9](https://github.com/sanity-io/next-sanity/compare/v1.0.8...v1.0.9) (2022-11-07)

### Bug Fixes

- add `package.json` to exports ([6abbcb1](https://github.com/sanity-io/next-sanity/commit/6abbcb13d9250d41c7e2302b77f071a1270a4c25))

## [1.0.8](https://github.com/sanity-io/next-sanity/compare/v1.0.7...v1.0.8) (2022-11-04)

### Bug Fixes

- mark internals ([5b714a9](https://github.com/sanity-io/next-sanity/commit/5b714a9a21ee3f7274ab683380e9430fb3148f27))

## [1.0.7](https://github.com/sanity-io/next-sanity/compare/v1.0.6...v1.0.7) (2022-11-04)

### Bug Fixes

- ESM + CJS interop bugs with `next-sanity/studio` ([b272225](https://github.com/sanity-io/next-sanity/commit/b27222538b435cbad00daf3600b28cede85472f6))

## [1.0.6](https://github.com/sanity-io/next-sanity/compare/v1.0.5...v1.0.6) (2022-11-03)

### Bug Fixes

- ESM bug in `next` + `studio v3` ([935be44](https://github.com/sanity-io/next-sanity/commit/935be44f00c0e2a262120758066a3a4996607ccf))

## [1.0.5](https://github.com/sanity-io/next-sanity/compare/v1.0.4...v1.0.5) (2022-11-03)

### Bug Fixes

- enable node native ESM ([#133](https://github.com/sanity-io/next-sanity/issues/133)) ([a47c3a1](https://github.com/sanity-io/next-sanity/commit/a47c3a1a8e73da7671db20444e35b249832a3bc1))

## [1.0.4](https://github.com/sanity-io/next-sanity/compare/v1.0.3...v1.0.4) (2022-11-03)

### Bug Fixes

- add TS release tags ([15d8c06](https://github.com/sanity-io/next-sanity/commit/15d8c0614722a070cf7734b4a2a5acef6a7ffa01))

## [1.0.3](https://github.com/sanity-io/next-sanity/compare/v1.0.2...v1.0.3) (2022-10-28)

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to ^1.0.3 ([afd27f5](https://github.com/sanity-io/next-sanity/commit/afd27f5d84f1439212f585345f2ef43e3b946507))

## [1.0.2](https://github.com/sanity-io/next-sanity/compare/v1.0.1...v1.0.2) (2022-10-27)

### Bug Fixes

- **deps:** update dependency @sanity/groq-store to v1 ([22f7b5a](https://github.com/sanity-io/next-sanity/commit/22f7b5a07ce38cb1df6efd1fd797e114543d979b))
- export the subscription options to avoid ts errors ([#104](https://github.com/sanity-io/next-sanity/issues/104)) ([2fca80f](https://github.com/sanity-io/next-sanity/commit/2fca80fee7cb47bde119f6c9acf4fb57fcafc2d2))

## [1.0.1](https://github.com/sanity-io/next-sanity/compare/v1.0.0...v1.0.1) (2022-10-25)

### Bug Fixes

- expand supported next version range to allow v13 ([5573e6d](https://github.com/sanity-io/next-sanity/commit/5573e6d23361f0b0b7370003aec6346cb9168d35))

## [1.0.0](https://github.com/sanity-io/next-sanity/compare/v0.8.5...v1.0.0) (2022-10-13)

### ⚠ BREAKING CHANGES

- upgrade to node v14 or later.

### Bug Fixes

- drop support for node v12 ([b831ef4](https://github.com/sanity-io/next-sanity/commit/b831ef4040687fe6f96323fa8ef141a0ce603343))
- use `@sanity/pkg-utils` for bundling ([6929f98](https://github.com/sanity-io/next-sanity/commit/6929f984891866e272f9bd344950661bb895c15d))

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
