<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.0.0](https://github.com/sanity-io/next-sanity/compare/v7.1.4...v8.0.0) (2024-02-12)

### ⚠ BREAKING CHANGES

- remove `next-sanity/studio/loading`
- remove `usePrefersColorScheme` hook
- remove `useTheme` hook
- remove `parseAppBody` export
- use `@sanity/client` instead of `@sanity/preview-kit/client` ([#996](https://github.com/sanity-io/next-sanity/issues/996))

### Features

- add `export {metadata, viewport} from 'next-sanity/studio'` support ([30148a9](https://github.com/sanity-io/next-sanity/commit/30148a91348bff8763ca67125fa8a5b2efc05ebf))
- support fast render of styled components SSR ([2a21d9c](https://github.com/sanity-io/next-sanity/commit/2a21d9c1b1413696c048d9fa203c93e859076113))
- use `@sanity/client` instead of `@sanity/preview-kit/client` ([#996](https://github.com/sanity-io/next-sanity/issues/996)) ([03e3f56](https://github.com/sanity-io/next-sanity/commit/03e3f56291b4e0888a08f78867580289bbc0e87f))

### Code Refactoring

- remove `next-sanity/studio/loading` ([45792c5](https://github.com/sanity-io/next-sanity/commit/45792c56454ab599bc93029a9455db412287373b))
- remove `parseAppBody` export ([604678d](https://github.com/sanity-io/next-sanity/commit/604678d58e00198c84271936e4696eec1fd8e31f))
- remove `usePrefersColorScheme` hook ([a30d11f](https://github.com/sanity-io/next-sanity/commit/a30d11f0f35868cd42ba3dcd103876cf0c79771a))
- remove `useTheme` hook ([9ee8cb1](https://github.com/sanity-io/next-sanity/commit/9ee8cb1792217571ab41c492874b529eb67d1065))

## [7.1.4](https://github.com/sanity-io/next-sanity/compare/v7.1.3...v7.1.4) (2024-02-09)

### Bug Fixes

- **deps:** Update dependency @sanity/visual-editing to v1.2.2 ([#994](https://github.com/sanity-io/next-sanity/issues/994)) ([a8e1559](https://github.com/sanity-io/next-sanity/commit/a8e1559dd3d1d2aa0bc1b1c7e41105a138cf5924))

## [7.1.3](https://github.com/sanity-io/next-sanity/compare/v7.1.2...v7.1.3) (2024-02-08)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5.0.20 ([#990](https://github.com/sanity-io/next-sanity/issues/990)) ([959d756](https://github.com/sanity-io/next-sanity/commit/959d7563d07c64cbb7881e4b50fc391cba656f21))

## [7.1.2](https://github.com/sanity-io/next-sanity/compare/v7.1.1...v7.1.2) (2024-02-08)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.12.4 ([#987](https://github.com/sanity-io/next-sanity/issues/987)) ([1170a18](https://github.com/sanity-io/next-sanity/commit/1170a1861afaf62ba952b2f203c9d71c22cf36a7))
- **deps:** Update dependency @sanity/visual-editing to v1.2.1 ([#989](https://github.com/sanity-io/next-sanity/issues/989)) ([7f89a20](https://github.com/sanity-io/next-sanity/commit/7f89a207ede60b0b5fa4075620ad33da89370a0a))

## [7.1.1](https://github.com/sanity-io/next-sanity/compare/v7.1.0...v7.1.1) (2024-02-07)

### Bug Fixes

- **deps:** Update dependency @sanity/visual-editing to v1.2.0 ([#978](https://github.com/sanity-io/next-sanity/issues/978)) ([de32f2b](https://github.com/sanity-io/next-sanity/commit/de32f2b67870bf69b2646473b66ef76ecf58a72c))
- narrow `node.engines` to `&gt;=18.17` ([69635fd](https://github.com/sanity-io/next-sanity/commit/69635fd73b95eab276650bbd81ef5c61a90e4fde))

## [7.1.0](https://github.com/sanity-io/next-sanity/compare/v7.0.17...v7.1.0) (2024-02-06)

### Features

- add `&lt;VisualEditing /&gt;` component ([#973](https://github.com/sanity-io/next-sanity/issues/973)) ([f2f1e68](https://github.com/sanity-io/next-sanity/commit/f2f1e680473a605c6319bb6bb3c2092b9dbac9fb))

## [7.0.17](https://github.com/sanity-io/next-sanity/compare/v7.0.16...v7.0.17) (2024-01-29)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5.0.19 ([#955](https://github.com/sanity-io/next-sanity/issues/955)) ([2eef5eb](https://github.com/sanity-io/next-sanity/commit/2eef5eb95633cdb9ec5942f78441974c78c7f5f1))

## [7.0.16](https://github.com/sanity-io/next-sanity/compare/v7.0.15...v7.0.16) (2024-01-29)

### Bug Fixes

- **deps:** add back v1 `@sanity/ui` range to peers to support older plugins ([8ae54c4](https://github.com/sanity-io/next-sanity/commit/8ae54c4a7af3bb51036c5557e5bd791d73558988))
- **deps:** downgrade webhooks package to solve engines warning ([#943](https://github.com/sanity-io/next-sanity/issues/943)) ([b35ffd3](https://github.com/sanity-io/next-sanity/commit/b35ffd35558335f887e936c21ecc5a8524505636))
- **deps:** update dependency @sanity/client to ^6.12.2 ([14e7c9b](https://github.com/sanity-io/next-sanity/commit/14e7c9b90bf04ea81ea6eaab2f1ad57b044e4b80))
- **deps:** update dependency @sanity/client to ^6.12.3 ([#947](https://github.com/sanity-io/next-sanity/issues/947)) ([05ca699](https://github.com/sanity-io/next-sanity/commit/05ca6996795a84c5c398d766b45df73ba71a1182))
- **deps:** update dependency @sanity/preview-kit to v5.0.18 ([#951](https://github.com/sanity-io/next-sanity/issues/951)) ([bdf3099](https://github.com/sanity-io/next-sanity/commit/bdf30998b0bf2d3ca33807daf8e3ecab6da9992c))

## [7.0.15](https://github.com/sanity-io/next-sanity/compare/v7.0.14...v7.0.15) (2024-01-26)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.12.0 ([#935](https://github.com/sanity-io/next-sanity/issues/935)) ([e66c335](https://github.com/sanity-io/next-sanity/commit/e66c3357e6d45f6347bd26f06b02ae4e7c695cd4))
- **deps:** update dependency @sanity/client to ^6.12.1 ([#936](https://github.com/sanity-io/next-sanity/issues/936)) ([0e2803b](https://github.com/sanity-io/next-sanity/commit/0e2803bf9acf2635534ecff01422d1b95168c950))
- **deps:** update dependency @sanity/preview-kit to v5.0.14 ([#930](https://github.com/sanity-io/next-sanity/issues/930)) ([47cf047](https://github.com/sanity-io/next-sanity/commit/47cf047aaedd922ea31686ae028495c2f8deefd3))
- **deps:** update dependency @sanity/preview-kit to v5.0.15 ([#932](https://github.com/sanity-io/next-sanity/issues/932)) ([585eccb](https://github.com/sanity-io/next-sanity/commit/585eccb553f0a2b3310fa02a70be2075b4299359))
- **deps:** update dependency @sanity/preview-kit to v5.0.17 ([#937](https://github.com/sanity-io/next-sanity/issues/937)) ([74014d6](https://github.com/sanity-io/next-sanity/commit/74014d6b1e698c3fa0ad094b36cdfab9ffad8598))
- **deps:** update dependency @sanity/webhook to v4.0.1 ([#928](https://github.com/sanity-io/next-sanity/issues/928)) ([2a7f478](https://github.com/sanity-io/next-sanity/commit/2a7f478239bacf662bc59ade094e252140a78d16))

## [7.0.14](https://github.com/sanity-io/next-sanity/compare/v7.0.13...v7.0.14) (2024-01-25)

### Bug Fixes

- add back beta peer dep range for `@sanity/ui` ([b0520e9](https://github.com/sanity-io/next-sanity/commit/b0520e9db4151e5f93848682ab8ff51fce8f0577)), closes [#920](https://github.com/sanity-io/next-sanity/issues/920)
- **deps:** update dependency @sanity/client to ^6.11.3 ([#921](https://github.com/sanity-io/next-sanity/issues/921)) ([a45202e](https://github.com/sanity-io/next-sanity/commit/a45202e946946ac722f1e472e26c5f22e434ff69))
- **deps:** update dependency @sanity/preview-kit to v5.0.13 ([#922](https://github.com/sanity-io/next-sanity/issues/922)) ([4d5d343](https://github.com/sanity-io/next-sanity/commit/4d5d3439bc115723c3e2b625885b2a706df7acec))
- **deps:** update dependency @sanity/webhook to v4.0.1 ([#925](https://github.com/sanity-io/next-sanity/issues/925)) ([42a6736](https://github.com/sanity-io/next-sanity/commit/42a6736ca042d387c6f714702ee2c36f2c52f9ef))

## [7.0.13](https://github.com/sanity-io/next-sanity/compare/v7.0.12...v7.0.13) (2024-01-25)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.11.2 ([#914](https://github.com/sanity-io/next-sanity/issues/914)) ([230646e](https://github.com/sanity-io/next-sanity/commit/230646ee11f630e4904386c0eec8cb0b005bdefd))

## [7.0.12](https://github.com/sanity-io/next-sanity/compare/v7.0.11...v7.0.12) (2024-01-19)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5.0.12 ([#910](https://github.com/sanity-io/next-sanity/issues/910)) ([165c618](https://github.com/sanity-io/next-sanity/commit/165c618cd7ab77a8d0d853e04c9ea5ce640ebb3a))

## [7.0.11](https://github.com/sanity-io/next-sanity/compare/v7.0.10...v7.0.11) (2024-01-19)

### Bug Fixes

- **deps:** bump next to `v14.1.x` ([ff4e80a](https://github.com/sanity-io/next-sanity/commit/ff4e80ab92a9745b00ffffb9bfda3df87f8c1288))
- **deps:** bump sanity to `v3.25.x` ([c1d8d62](https://github.com/sanity-io/next-sanity/commit/c1d8d6245d5abf9c95f6a458de2b655dbcd17e77))

## [7.0.10](https://github.com/sanity-io/next-sanity/compare/v7.0.9...v7.0.10) (2024-01-11)

### Bug Fixes

- add `unstable__adapter` and `unstable__environment` exports ([f35a00f](https://github.com/sanity-io/next-sanity/commit/f35a00f69111bae6b65911e032e68df6f02125e0))

## [7.0.9](https://github.com/sanity-io/next-sanity/compare/v7.0.8...v7.0.9) (2024-01-10)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.11.1 ([#883](https://github.com/sanity-io/next-sanity/issues/883)) ([a2ac0b3](https://github.com/sanity-io/next-sanity/commit/a2ac0b342b498adab1a31d9d10ae12a23a11f2d1))
- **deps:** update dependency @sanity/preview-kit to v5.0.11 ([#884](https://github.com/sanity-io/next-sanity/issues/884)) ([0800bad](https://github.com/sanity-io/next-sanity/commit/0800badb4c2c4118c9345771bd156bda8214d04e))

## [7.0.8](https://github.com/sanity-io/next-sanity/compare/v7.0.7...v7.0.8) (2024-01-10)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.11.0 ([#876](https://github.com/sanity-io/next-sanity/issues/876)) ([6ccba1b](https://github.com/sanity-io/next-sanity/commit/6ccba1b2f0615abc8ad765eaa7d691db15427e42))
- **deps:** update dependency @sanity/preview-kit to v5.0.10 ([#865](https://github.com/sanity-io/next-sanity/issues/865)) ([e86257d](https://github.com/sanity-io/next-sanity/commit/e86257dacd589a99ff8b13b54ff046c5afafe24c))

## [7.0.7](https://github.com/sanity-io/next-sanity/compare/v7.0.6...v7.0.7) (2024-01-05)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5.0.9 ([9afdbd2](https://github.com/sanity-io/next-sanity/commit/9afdbd2b5dba96816c9704e48d23989384204e40))

## [7.0.6](https://github.com/sanity-io/next-sanity/compare/v7.0.5...v7.0.6) (2024-01-02)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5.0.7 ([#856](https://github.com/sanity-io/next-sanity/issues/856)) ([afc79da](https://github.com/sanity-io/next-sanity/commit/afc79da393df190fb14ca7b3a79684d16c26bdc0))

## [7.0.5](https://github.com/sanity-io/next-sanity/compare/v7.0.4...v7.0.5) (2023-12-22)

### Bug Fixes

- **deps:** widen @sanity/ui peer dependency range ([#842](https://github.com/sanity-io/next-sanity/issues/842)) ([14d4765](https://github.com/sanity-io/next-sanity/commit/14d47652875575892d7c83d2cf3af78a9884fb43))

## [7.0.4](https://github.com/sanity-io/next-sanity/compare/v7.0.3...v7.0.4) (2023-12-12)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.10.0 ([#833](https://github.com/sanity-io/next-sanity/issues/833)) ([2d4c7fc](https://github.com/sanity-io/next-sanity/commit/2d4c7fc79af04b3f6df52b9440b201833e49d667))
- **deps:** update dependency @sanity/preview-kit to v5.0.6 ([#836](https://github.com/sanity-io/next-sanity/issues/836)) ([c71e01d](https://github.com/sanity-io/next-sanity/commit/c71e01d81005a3fd6d3116bc587136b118cd0550))

## [7.0.3](https://github.com/sanity-io/next-sanity/compare/v7.0.2...v7.0.3) (2023-12-08)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.9.3 ([#818](https://github.com/sanity-io/next-sanity/issues/818)) ([af983af](https://github.com/sanity-io/next-sanity/commit/af983aff36c59ed8f67b29851a060ec78c3cd821))
- **deps:** update dependency @sanity/preview-kit to v5.0.5 ([#823](https://github.com/sanity-io/next-sanity/issues/823)) ([d611631](https://github.com/sanity-io/next-sanity/commit/d6116317f023829273b58bdc37bfa60ad00fd22d))

## [7.0.2](https://github.com/sanity-io/next-sanity/compare/v7.0.1...v7.0.2) (2023-12-07)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.9.2 ([#816](https://github.com/sanity-io/next-sanity/issues/816)) ([1c6476e](https://github.com/sanity-io/next-sanity/commit/1c6476e97e5ecd75a9260e16dc28dff1bc461d59))
- **deps:** update dependency @sanity/preview-kit to v5.0.3 ([#813](https://github.com/sanity-io/next-sanity/issues/813)) ([27bf9c4](https://github.com/sanity-io/next-sanity/commit/27bf9c42445d3f33ba5febd9436b4d56227fa10d))

## [7.0.1](https://github.com/sanity-io/next-sanity/compare/v7.0.0...v7.0.1) (2023-12-01)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5.0.1 ([#790](https://github.com/sanity-io/next-sanity/issues/790)) ([4949905](https://github.com/sanity-io/next-sanity/commit/4949905cdf54e0c923e59fb5e914409ad42c1972))
- set `encodeSourceMap` to `false` instead of `auto` by default ([#792](https://github.com/sanity-io/next-sanity/issues/792)) ([6827784](https://github.com/sanity-io/next-sanity/commit/6827784c77f9ef13ef2c40bfe9ac28adb1725592))

## [7.0.0](https://github.com/sanity-io/next-sanity/compare/v6.1.3...v7.0.0) (2023-11-29)

### ⚠ BREAKING CHANGES

- remove the deprecated `next-sanity/studio/head` export
- **deps:** update dependency @sanity/preview-kit to v5 ([#782](https://github.com/sanity-io/next-sanity/issues/782))

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v5 ([#782](https://github.com/sanity-io/next-sanity/issues/782)) ([b2eb9cf](https://github.com/sanity-io/next-sanity/commit/b2eb9cf50879cbd0b3493cd3eb7ac2a70c6839e7))
- remove the deprecated `next-sanity/studio/head` export ([130a1ec](https://github.com/sanity-io/next-sanity/commit/130a1ec6d15c460585c81426efce27c87cc4f8db))

## [6.1.3](https://github.com/sanity-io/next-sanity/compare/v6.1.2...v6.1.3) (2023-11-29)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v4.0.2 ([#780](https://github.com/sanity-io/next-sanity/issues/780)) ([a7ffc93](https://github.com/sanity-io/next-sanity/commit/a7ffc9320397ea47731f24989e63e6927e364a91))

## [6.1.2](https://github.com/sanity-io/next-sanity/compare/v6.1.1...v6.1.2) (2023-11-28)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.9.1 ([#777](https://github.com/sanity-io/next-sanity/issues/777)) ([b82dd77](https://github.com/sanity-io/next-sanity/commit/b82dd77951a0be72f729f9819e64108e29394366))

## [6.1.1](https://github.com/sanity-io/next-sanity/compare/v6.1.0...v6.1.1) (2023-11-28)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.9.0 ([#775](https://github.com/sanity-io/next-sanity/issues/775)) ([b4aba41](https://github.com/sanity-io/next-sanity/commit/b4aba4199b7d380d69eeee7a0cace60bedc83fce))
- resolve `ReferenceError: liveQuery__namespace is not defined` error in pages router ([e0ea8ca](https://github.com/sanity-io/next-sanity/commit/e0ea8ca5dd027bac9e50a20ea7561cdbda7f3a76))

## [6.1.0](https://github.com/sanity-io/next-sanity/compare/v6.0.5...v6.1.0) (2023-11-27)

### Features

- **webhook:** the edge runtime is now supported ([fb75313](https://github.com/sanity-io/next-sanity/commit/fb75313362bb9f346d50791d87b4ea28adae6d88))

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v4.0.1 ([#759](https://github.com/sanity-io/next-sanity/issues/759)) ([f44659d](https://github.com/sanity-io/next-sanity/commit/f44659d3e3d2d7e8ab4e118abb377ac21bd0c3fa))
- **deps:** update dependency @sanity/webhook to v4 ([#767](https://github.com/sanity-io/next-sanity/issues/767)) ([b339cfe](https://github.com/sanity-io/next-sanity/commit/b339cfe56ad9ae768ae2a6a42424b361609dbf18))

## [6.0.5](https://github.com/sanity-io/next-sanity/compare/v6.0.4...v6.0.5) (2023-11-17)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v4 ([#753](https://github.com/sanity-io/next-sanity/issues/753)) ([d05ac92](https://github.com/sanity-io/next-sanity/commit/d05ac920b03089fca93251e311f667b30ed380e6))

## [6.0.4](https://github.com/sanity-io/next-sanity/compare/v6.0.3...v6.0.4) (2023-11-17)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v3.2.10 ([d77cafb](https://github.com/sanity-io/next-sanity/commit/d77cafb3c21155c458626ce15b016f0259347a7e))

## [6.0.3](https://github.com/sanity-io/next-sanity/compare/v6.0.2...v6.0.3) (2023-11-16)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v3.2.8 ([#746](https://github.com/sanity-io/next-sanity/issues/746)) ([38140c1](https://github.com/sanity-io/next-sanity/commit/38140c1536618b0aa3ca4feeb4090581b848bc55))

## [6.0.2](https://github.com/sanity-io/next-sanity/compare/v6.0.1...v6.0.2) (2023-11-16)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.8.6 ([#738](https://github.com/sanity-io/next-sanity/issues/738)) ([568809c](https://github.com/sanity-io/next-sanity/commit/568809ccb7f7b0b886a3dc79c4e4979181dcfd0b))
- **deps:** update dependency @sanity/preview-kit to v3.2.7 ([#732](https://github.com/sanity-io/next-sanity/issues/732)) ([e4edf69](https://github.com/sanity-io/next-sanity/commit/e4edf69dff422a709ec3b69fcbec25943a6c71b9))

## [6.0.1](https://github.com/sanity-io/next-sanity/compare/v6.0.0...v6.0.1) (2023-11-06)

### Bug Fixes

- add missing viewport type to package.json ([#730](https://github.com/sanity-io/next-sanity/issues/730)) ([c55193a](https://github.com/sanity-io/next-sanity/commit/c55193a5661d22f475a06f3dd71865b2e97ef27f))

## [6.0.0](https://github.com/sanity-io/next-sanity/compare/v5.5.10...v6.0.0) (2023-11-05)

### ⚠ BREAKING CHANGES

- drop support for Next v13
- add support for Next.js 14 viewport object ([#718](https://github.com/sanity-io/next-sanity/issues/718))

### Features

- add support for Next.js 14 viewport object ([#718](https://github.com/sanity-io/next-sanity/issues/718)) ([f46f091](https://github.com/sanity-io/next-sanity/commit/f46f091e5e31c6f9d317665b6006bdd87e389228))

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.7.1 ([7322ade](https://github.com/sanity-io/next-sanity/commit/7322adee1adbd465d252c174e1459688c90693ca))
- drop support for Next v13 ([030bf16](https://github.com/sanity-io/next-sanity/commit/030bf16324089fa211042b018a7b332d0a14e9cf))
- **README:** add migration guide for v6 ([74f10ba](https://github.com/sanity-io/next-sanity/commit/74f10ba215ae79930598ec4ae23c409fb03ec976))

## [5.5.10](https://github.com/sanity-io/next-sanity/compare/v5.5.9...v5.5.10) (2023-10-27)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.7.0 ([#716](https://github.com/sanity-io/next-sanity/issues/716)) ([bf04647](https://github.com/sanity-io/next-sanity/commit/bf046471934f7534e5aff6ddb82039d769fd8c62))

## [5.5.9](https://github.com/sanity-io/next-sanity/compare/v5.5.8...v5.5.9) (2023-10-27)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.7.0 ([#701](https://github.com/sanity-io/next-sanity/issues/701)) ([c40b9aa](https://github.com/sanity-io/next-sanity/commit/c40b9aac4b3f79d27a3055a822067eae12991d44))
- **deps:** update dependency @sanity/preview-kit to v3.2.3 ([#689](https://github.com/sanity-io/next-sanity/issues/689)) ([f15fc0f](https://github.com/sanity-io/next-sanity/commit/f15fc0f5663d3fd2ac292babfa063d45556128cb))
- **deps:** update dependency @sanity/preview-kit to v3.2.6 ([#699](https://github.com/sanity-io/next-sanity/issues/699)) ([ebf46f1](https://github.com/sanity-io/next-sanity/commit/ebf46f1492bf69d6fed4022321fc4d84017639de))
- **deps:** Update dependency next to ^13.0.0 || ^14.0.0 ([#713](https://github.com/sanity-io/next-sanity/issues/713)) ([45b7ecd](https://github.com/sanity-io/next-sanity/commit/45b7ecdbfd9d1fb4b90ed1487e9aa6bf6ec24bd2))

## [5.5.8](https://github.com/sanity-io/next-sanity/compare/v5.5.7...v5.5.8) (2023-10-12)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.6.0 ([#680](https://github.com/sanity-io/next-sanity/issues/680)) ([abe2f4c](https://github.com/sanity-io/next-sanity/commit/abe2f4c4a2942354a19865c23fc8d8501ca859c8))
- **deps:** update dependency @sanity/preview-kit to v3.2.0 ([#681](https://github.com/sanity-io/next-sanity/issues/681)) ([17d1bfc](https://github.com/sanity-io/next-sanity/commit/17d1bfc0b6361b2dd600c79746b949273ebf4a19))

## [5.5.7](https://github.com/sanity-io/next-sanity/compare/v5.5.6...v5.5.7) (2023-10-11)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.5.0 ([#678](https://github.com/sanity-io/next-sanity/issues/678)) ([3104f2f](https://github.com/sanity-io/next-sanity/commit/3104f2f452c42d311fb9552ae0fcc30ccf15c9bd))

## [5.5.6](https://github.com/sanity-io/next-sanity/compare/v5.5.5...v5.5.6) (2023-10-11)

### Bug Fixes

- bump `engines.node` to &gt;= 18 ([791f604](https://github.com/sanity-io/next-sanity/commit/791f6041c08ac8121baf18d9aa5c82d96f4294b2))
- **deps:** update dependency @sanity/client to ^6.5.0 ([#674](https://github.com/sanity-io/next-sanity/issues/674)) ([d1a6213](https://github.com/sanity-io/next-sanity/commit/d1a6213bd857454a8a98995ac386316c676024f4))

## [5.5.5](https://github.com/sanity-io/next-sanity/compare/v5.5.4...v5.5.5) (2023-10-05)

### Bug Fixes

- **docs:** update revalidate app dir snippet ([#660](https://github.com/sanity-io/next-sanity/issues/660)) ([c6423a6](https://github.com/sanity-io/next-sanity/commit/c6423a6f1d22c48dcec2e4e0228aa4439b80f21f))

## [5.5.4](https://github.com/sanity-io/next-sanity/compare/v5.5.3...v5.5.4) (2023-09-19)

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.4.12 ([#626](https://github.com/sanity-io/next-sanity/issues/626)) ([fe3fa72](https://github.com/sanity-io/next-sanity/commit/fe3fa725f574ebb9e4414bc34e44d6988e1c0d94))

## [5.5.3](https://github.com/sanity-io/next-sanity/compare/v5.5.2...v5.5.3) (2023-09-13)

### Bug Fixes

- remove `cache` from example, add disclaimer ([#622](https://github.com/sanity-io/next-sanity/issues/622)) ([c57d28b](https://github.com/sanity-io/next-sanity/commit/c57d28b3ee4eb161eaa1f01929afbfa5260b77b6))

## [5.5.2](https://github.com/sanity-io/next-sanity/compare/v5.5.1...v5.5.2) (2023-09-13)

### Bug Fixes

- replace client configuration with client.fetch configuration ([#620](https://github.com/sanity-io/next-sanity/issues/620)) ([d3c0669](https://github.com/sanity-io/next-sanity/commit/d3c06695ffb201ce867e19d31d6ed5d7e88a6063))

## [5.5.1](https://github.com/sanity-io/next-sanity/compare/v5.5.0...v5.5.1) (2023-09-13)

### Bug Fixes

- give README a content hug ([#604](https://github.com/sanity-io/next-sanity/issues/604)) ([eb69b08](https://github.com/sanity-io/next-sanity/commit/eb69b08b57eda765cddce32c82d8fa8135cb7057))

## [5.5.0](https://github.com/sanity-io/next-sanity/compare/v5.4.6...v5.5.0) (2023-09-13)

### Features

- **deps:** `@sanity/client` is a regular dependency instead of a peer ([4a7dbb0](https://github.com/sanity-io/next-sanity/commit/4a7dbb0aaf715927ada2f2ecf4299dddc6f01962))

### Bug Fixes

- **deps:** update dependency @sanity/client to ^6.4.11 ([#603](https://github.com/sanity-io/next-sanity/issues/603)) ([4d2790d](https://github.com/sanity-io/next-sanity/commit/4d2790de3c00b2a720cd54811b1656e237706482))

## [5.4.6](https://github.com/sanity-io/next-sanity/compare/v5.4.5...v5.4.6) (2023-08-23)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v3.1.6 ([2864533](https://github.com/sanity-io/next-sanity/commit/28645334019174c440a9df6c17a1e444ac40362a))

## [5.4.5](https://github.com/sanity-io/next-sanity/compare/v5.4.4...v5.4.5) (2023-08-23)

### Bug Fixes

- **deps:** allow `styled-components` v6 ([8bd981b](https://github.com/sanity-io/next-sanity/commit/8bd981bf92af29052ea3fc379081ffff346dce39))
- **deps:** update dependency @sanity/preview-kit to v3.1.5 ([#578](https://github.com/sanity-io/next-sanity/issues/578)) ([0c977aa](https://github.com/sanity-io/next-sanity/commit/0c977aa14abd5ef86069dd277964b6fb8e434629))

## [5.4.4](https://github.com/sanity-io/next-sanity/compare/v5.4.3...v5.4.4) (2023-08-19)

### Bug Fixes

- **deps:** update dependency @sanity/client to v6.4.9 ([#563](https://github.com/sanity-io/next-sanity/issues/563)) ([150d5f3](https://github.com/sanity-io/next-sanity/commit/150d5f36b85704214a3788a78ccdaa847e578b86))
- **deps:** Update dependency @sanity/preview-kit to v3.1.4 ([#559](https://github.com/sanity-io/next-sanity/issues/559)) ([ced71f9](https://github.com/sanity-io/next-sanity/commit/ced71f9e61b2e8f7b01094c0a651185053c09d62))
- **deps:** Update dependency @sanity/webhook to v3.0.1 ([#566](https://github.com/sanity-io/next-sanity/issues/566)) ([9e3ebe8](https://github.com/sanity-io/next-sanity/commit/9e3ebe8c15ae2ab0ba331228ab7090a489c835a6))
- **webhook:** detect if `bodyParser` is `true` ([b62db0d](https://github.com/sanity-io/next-sanity/commit/b62db0d2125a2f0728a4b352f6d2f3d6d6e0392a))
- **webhook:** throw if the edge runtime is detected ([ecf96fb](https://github.com/sanity-io/next-sanity/commit/ecf96fb0a18868e8fb3346011af78faf22f8aabd))

## [5.4.3](https://github.com/sanity-io/next-sanity/compare/v5.4.2...v5.4.3) (2023-08-18)

### Bug Fixes

- **deps:** Update dependency @sanity/webhook to v3 ([#562](https://github.com/sanity-io/next-sanity/issues/562)) ([4843f26](https://github.com/sanity-io/next-sanity/commit/4843f26db69d3dbd1e1a3b351fae4faa17db5947))
- **webhook:** support both app and pages router with the same `parseBody` API ([4659898](https://github.com/sanity-io/next-sanity/commit/465989862044b16bb8c93e5914d61a1a30cc99c4))

## [5.4.2](https://github.com/sanity-io/next-sanity/compare/v5.4.1...v5.4.2) (2023-08-18)

### Bug Fixes

- **deps:** update dependency @sanity/client to v6.4.8 ([#560](https://github.com/sanity-io/next-sanity/issues/560)) ([ef46e52](https://github.com/sanity-io/next-sanity/commit/ef46e529e1e7ed3f89063370b99bc9e6ad6ab80f))
- **deps:** update dependency @sanity/preview-kit to v3.1.3 ([49303b1](https://github.com/sanity-io/next-sanity/commit/49303b1c4a3bcfcefc304824453726f1f9735e53))
- **docs:** update guide to use LiveQuery wrappers ([#557](https://github.com/sanity-io/next-sanity/issues/557)) ([3626f7d](https://github.com/sanity-io/next-sanity/commit/3626f7d36530f9a777ce5389c3b583aba4a831bd))

## [5.4.1](https://github.com/sanity-io/next-sanity/compare/v5.4.0...v5.4.1) (2023-08-17)

### Bug Fixes

- **deps:** update dependency @sanity/client to v6.4.7 ([#555](https://github.com/sanity-io/next-sanity/issues/555)) ([62f069d](https://github.com/sanity-io/next-sanity/commit/62f069dd507dc249ae0107ba05b0d2404b6e6280))
- **deps:** update dependency @sanity/preview-kit to v3.1.1 ([#541](https://github.com/sanity-io/next-sanity/issues/541)) ([3ed1fb6](https://github.com/sanity-io/next-sanity/commit/3ed1fb6007ad424f0837c4857523adc0f68362a9))

## [5.4.0](https://github.com/sanity-io/next-sanity/compare/v5.3.0...v5.4.0) (2023-08-14)

### Features

- add experimental `LiveQuery` component ([0eb5c9b](https://github.com/sanity-io/next-sanity/commit/0eb5c9b48a2a2ed7c085020cf76462462217dea7))

### Bug Fixes

- **studio:** add `use client` to `next-sanity/studio/loading` ([1a9e002](https://github.com/sanity-io/next-sanity/commit/1a9e00285f5af96da5f073faa3dc449e62afc6c3))

## [5.3.0](https://github.com/sanity-io/next-sanity/compare/v5.2.7...v5.3.0) (2023-08-14)

### Features

- **preview:** lazy load `LiveQueryProvider` with `next/dynamic` ([8ecb50e](https://github.com/sanity-io/next-sanity/commit/8ecb50e62b91c13983e82b88ce50676e6d6c4fe4)), closes [#516](https://github.com/sanity-io/next-sanity/issues/516)

### Bug Fixes

- **deps:** Update dependency @sanity/preview-kit to v3 ([#538](https://github.com/sanity-io/next-sanity/issues/538)) ([761d586](https://github.com/sanity-io/next-sanity/commit/761d586ca727adc68a4d20d377820a4cdad5b4d3))

## [5.2.7](https://github.com/sanity-io/next-sanity/compare/v5.2.6...v5.2.7) (2023-08-13)

### Bug Fixes

- **deps:** update dependency @sanity/client to v6.4.6 ([#534](https://github.com/sanity-io/next-sanity/issues/534)) ([d4bd39f](https://github.com/sanity-io/next-sanity/commit/d4bd39f7e2b042622156ad4658412a14238248e2))
- **deps:** Update dependency @sanity/preview-kit to v2.6.0 ([#536](https://github.com/sanity-io/next-sanity/issues/536)) ([2088096](https://github.com/sanity-io/next-sanity/commit/20880960c14961fb83c15bf7511484e6d66ed41d))

## [5.2.6](https://github.com/sanity-io/next-sanity/compare/v5.2.5...v5.2.6) (2023-08-11)

### Bug Fixes

- **deps:** Update dependency @sanity/preview-kit to v2.4.12 ([2abea72](https://github.com/sanity-io/next-sanity/commit/2abea720c836a56c80072888757a3dee440f08f3))

## [5.2.5](https://github.com/sanity-io/next-sanity/compare/v5.2.4...v5.2.5) (2023-08-11)

### Bug Fixes

- **deps:** update dependency @sanity/client to v6.4.4 ([#517](https://github.com/sanity-io/next-sanity/issues/517)) ([f8ddee6](https://github.com/sanity-io/next-sanity/commit/f8ddee6498cab2f6baffc5d52b021928354035ae))
- **deps:** update dependency @sanity/client to v6.4.5 ([#526](https://github.com/sanity-io/next-sanity/issues/526)) ([dc8f33f](https://github.com/sanity-io/next-sanity/commit/dc8f33f4dd568cc07ed7732cbc95b8a6e1b921b5))
- **deps:** Update dependency @sanity/preview-kit to v2.4.10 ([#525](https://github.com/sanity-io/next-sanity/issues/525)) ([58d95d6](https://github.com/sanity-io/next-sanity/commit/58d95d65f676ef7b50b7d6a5409fbe18d783cb0c))
- **deps:** Update dependency @sanity/preview-kit to v2.4.11 ([#530](https://github.com/sanity-io/next-sanity/issues/530)) ([6010998](https://github.com/sanity-io/next-sanity/commit/60109988da77412d4b8142529e36d19979a02e6a)), closes [#516](https://github.com/sanity-io/next-sanity/issues/516)

## [5.2.4](https://github.com/sanity-io/next-sanity/compare/v5.2.3...v5.2.4) (2023-08-09)

### Bug Fixes

- **webhooks:** make webhook response type configurable ([bb4898b](https://github.com/sanity-io/next-sanity/commit/bb4898b2d05c4146e41b5ce7cf2b16c99a202522))

## [5.2.3](https://github.com/sanity-io/next-sanity/compare/v5.2.2...v5.2.3) (2023-08-08)

### Bug Fixes

- `styled-components` getting mangled in `next dev` ([ac4a288](https://github.com/sanity-io/next-sanity/commit/ac4a288e24460c83c3d25b51b6de3e23780bd88f)), closes [#515](https://github.com/sanity-io/next-sanity/issues/515)

## [5.2.2](https://github.com/sanity-io/next-sanity/compare/v5.2.1...v5.2.2) (2023-08-07)

### Bug Fixes

- **deps:** add `react-server` export condition ([#510](https://github.com/sanity-io/next-sanity/issues/510)) ([b1b3af5](https://github.com/sanity-io/next-sanity/commit/b1b3af543ae9438b0a069b3dbf117f4c922219f3))
- **deps:** Update dependency @sanity/preview-kit to v2.4.9 ([#513](https://github.com/sanity-io/next-sanity/issues/513)) ([dd59dc6](https://github.com/sanity-io/next-sanity/commit/dd59dc63d87559142351a3aaac0ce53f26796458))

## [5.2.1](https://github.com/sanity-io/next-sanity/compare/v5.2.0...v5.2.1) (2023-08-07)

### Bug Fixes

- add `node.module` export condition ([a951940](https://github.com/sanity-io/next-sanity/commit/a9519401ee02b7336094d1f0ece77edd05d3abb5))
- **deps:** update dependency @sanity/client to v6.4.2 ([145c953](https://github.com/sanity-io/next-sanity/commit/145c9539b1dd91b2d5aa6ad720890ecd2dec1d05))
- **deps:** Update dependency @sanity/preview-kit to v2.4.8 ([#511](https://github.com/sanity-io/next-sanity/issues/511)) ([93ac424](https://github.com/sanity-io/next-sanity/commit/93ac4244f8b79431f755134103162e73dbeded69))

## [5.2.0](https://github.com/sanity-io/next-sanity/compare/v5.1.7...v5.2.0) (2023-08-06)

### Features

- add `parseAppBody` [#467](https://github.com/sanity-io/next-sanity/issues/467) ([05489de](https://github.com/sanity-io/next-sanity/commit/05489de527a718de9a6d4bcf746fa2cb7cca48f8))

## [5.1.7](https://github.com/sanity-io/next-sanity/compare/v5.1.6...v5.1.7) (2023-08-06)

### Bug Fixes

- **deps:** update dependency @sanity/pkg-utils to ^2.3.12 ([#504](https://github.com/sanity-io/next-sanity/issues/504)) ([bd0d801](https://github.com/sanity-io/next-sanity/commit/bd0d801e9750d7d96d72255358752066f2b527bd))

## [5.1.6](https://github.com/sanity-io/next-sanity/compare/v5.1.5...v5.1.6) (2023-08-05)

### Bug Fixes

- **deps:** Update dependency @sanity/preview-kit to v2.4.7 ([#502](https://github.com/sanity-io/next-sanity/issues/502)) ([25713ef](https://github.com/sanity-io/next-sanity/commit/25713ef08e12bb0360a6d8ec451b3ea6b1f7849c)), closes [#492](https://github.com/sanity-io/next-sanity/issues/492) [#490](https://github.com/sanity-io/next-sanity/issues/490) [#453](https://github.com/sanity-io/next-sanity/issues/453) [#458](https://github.com/sanity-io/next-sanity/issues/458)

## [5.1.5](https://github.com/sanity-io/next-sanity/compare/v5.1.4...v5.1.5) (2023-08-04)

### Bug Fixes

- **deps:** Update dependency @sanity/preview-kit to v2.4.3 ([#501](https://github.com/sanity-io/next-sanity/issues/501)) ([8a9ff72](https://github.com/sanity-io/next-sanity/commit/8a9ff72998d9cad7e3a6f96fea3b79cc989a054d))

## [5.1.4](https://github.com/sanity-io/next-sanity/compare/v5.1.3...v5.1.4) (2023-08-04)

### Bug Fixes

- **deps:** Update dependency @sanity/preview-kit to v2.4.2 ([#500](https://github.com/sanity-io/next-sanity/issues/500)) ([fb5e538](https://github.com/sanity-io/next-sanity/commit/fb5e5383ee3262564c63bb0603b7ff6959a124d9))

## [5.1.3](https://github.com/sanity-io/next-sanity/compare/v5.1.2...v5.1.3) (2023-08-02)

### Bug Fixes

- **deps:** update non-major ([#491](https://github.com/sanity-io/next-sanity/issues/491)) ([dd0293c](https://github.com/sanity-io/next-sanity/commit/dd0293c8485e2d5f253fc36b027c8ef17791fd07))

## [5.1.2](https://github.com/sanity-io/next-sanity/compare/v5.1.1...v5.1.2) (2023-07-13)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v2.3.3 ([#489](https://github.com/sanity-io/next-sanity/issues/489)) ([d2336c8](https://github.com/sanity-io/next-sanity/commit/d2336c87437fdf4316ff1deefcfcc54efc179fb2))
- **deps:** update non-major ([#485](https://github.com/sanity-io/next-sanity/issues/485)) ([3c35fe3](https://github.com/sanity-io/next-sanity/commit/3c35fe3726f6487fea58ef6924fc9b8d3a2eb0b0))

## [5.1.1](https://github.com/sanity-io/next-sanity/compare/v5.1.0...v5.1.1) (2023-07-07)

### Bug Fixes

- **deps:** update non-major ([#479](https://github.com/sanity-io/next-sanity/issues/479)) ([3a575fd](https://github.com/sanity-io/next-sanity/commit/3a575fd41dffa23c796e32db887b3a86d5e018aa))

## [5.1.0](https://github.com/sanity-io/next-sanity/compare/v5.0.2...v5.1.0) (2023-06-29)

### Features

- use perspective features ([#465](https://github.com/sanity-io/next-sanity/issues/465)) ([76db810](https://github.com/sanity-io/next-sanity/commit/76db810105376386086d47df6c97dbb987270ff8))

### Bug Fixes

- **deps:** update non-major ([#473](https://github.com/sanity-io/next-sanity/issues/473)) ([a9eb461](https://github.com/sanity-io/next-sanity/commit/a9eb461ae7a30cb07d1213700fe3c37bcd9766e9))
- **webhook:** revert `app-router` support from ([#460](https://github.com/sanity-io/next-sanity/issues/460)) ([2a5bfbb](https://github.com/sanity-io/next-sanity/commit/2a5bfbb88f97bc6a27c396c83586381a709fea2f))

## [5.0.2](https://github.com/sanity-io/next-sanity/compare/v5.0.1...v5.0.2) (2023-06-21)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v2.2.2 ([#464](https://github.com/sanity-io/next-sanity/issues/464)) ([288f543](https://github.com/sanity-io/next-sanity/commit/288f543cb7eb8b623641589b2c09e53e840510a0))

## [5.0.1](https://github.com/sanity-io/next-sanity/compare/v5.0.0...v5.0.1) (2023-06-21)

### Bug Fixes

- **webhook:** add `app-router` support ([#460](https://github.com/sanity-io/next-sanity/issues/460)) ([c2f6155](https://github.com/sanity-io/next-sanity/commit/c2f6155bdfc26feace614fd7b1cb1887c84d14c5))

## [5.0.0](https://github.com/sanity-io/next-sanity/compare/v4.3.3...v5.0.0) (2023-06-21)

### ⚠ BREAKING CHANGES

- `definePreview` and `<PreviewSuspense>` are replaced by `<LiveQueryProvider>`.
- `usePreview` is replaced by `useLiveQuery`.
- `@sanity/client` is now a peer dependency.

[The migration guide outlines every breaking change and how to migrate your code](https://github.com/sanity-io/next-sanity/#migration-guides)

### Bug Fixes

- Preview hooks no longer perform queries while the initial dataset export is streaming, as this could lead to incomplete query results and unexpected cases of `null`.

## [4.3.3](https://github.com/sanity-io/next-sanity/compare/v4.3.2...v4.3.3) (2023-05-24)

### Bug Fixes

- **deps:** upgrade `@sanity/preview-kit` to v1.5.4 ([7c7ec79](https://github.com/sanity-io/next-sanity/commit/7c7ec79e4aff6937ee4581bc7381e9457fc1b005))

## [4.3.2](https://github.com/sanity-io/next-sanity/compare/v4.3.1...v4.3.2) (2023-05-03)

### Bug Fixes

- add back `SanityClient` export ([86ee531](https://github.com/sanity-io/next-sanity/commit/86ee531bb894a41a7e6db0d02651d3b73af03cac))

## [4.3.1](https://github.com/sanity-io/next-sanity/compare/v4.3.0...v4.3.1) (2023-05-03)

### Bug Fixes

- add release notes ([9e9d4e0](https://github.com/sanity-io/next-sanity/commit/9e9d4e081c161db84a5e1d59890f05508be1b504))

## [4.3.0](https://github.com/sanity-io/next-sanity/compare/v4.2.1...v4.3.0) (2023-05-03)

### Introducing Visual Editing

> **Note**
>
> Visual Editing is available for select [Sanity enterprise customers](https://www.sanity.io/enterprise?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch). If you would like to use Visual Editing with Vercel, you will also need to contact Vercel to enable this feature for your Vercel team. [You may contact our sales team for more information.](https://www.sanity.io/contact/sales?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch)

![](https://i.imgur.com/wt95U5Q.jpg)

This release includes support for Visual Editing and Content Source Maps. This feature enables you to make deep edit links from components in a front end that takes you to respective fields in the Studio. This enables a new workflow that substantially reduces the time it takes to make changes by bringing you directly to the relevant field where you can make edits reliably in its appropriate context. For more information on Visual Editing, [check out the documentation here](https://www.sanity.io/docs/vercel-visual-editing?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch).

Existing Sanity enterprise customers can contact their dedicated customer success manager to enable this feature. [Customers interested in upgrading to an enterprise plan can contact our sales team for more information](https://www.sanity.io/contact/sales?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch). You will also need to [contact Vercel sales](https://vercel.com/contact/sales) to enable this feature for your Vercel team.

Sanity enterprise customers can also use the Content Source Maps with GROQ to build custom Visual Editing capabilities. For more information, [check out the Content Source Maps documentation here](https://www.sanity.io/docs/content-source-maps?utm_source=github.com&utm_medium=referral&utm_campaign=may-vercel-launch).

---

This release is also available on:

- [npm package (@latest dist-tag)](https://www.npmjs.com/package/next-sanity/v/4.3.0)

## [4.2.1](https://github.com/sanity-io/next-sanity/compare/v4.2.0...v4.2.1) (2023-05-03)

### Bug Fixes

- **docs:** update the `pages` metadata example ([7b30ea7](https://github.com/sanity-io/next-sanity/commit/7b30ea7fe638f10c049667f47ca7a4fbf6375f7e))

## [4.2.0](https://github.com/sanity-io/next-sanity/compare/v4.1.8...v4.2.0) (2023-04-28)

### Features

- add `unstable__fastRender` experiment ([60ef49e](https://github.com/sanity-io/next-sanity/commit/60ef49e0f0f48461a3bc481bc6c4389aaf717380))
- add support for metadata API ([#405](https://github.com/sanity-io/next-sanity/issues/405)) ([5ed8609](https://github.com/sanity-io/next-sanity/commit/5ed8609fd83835d18a1b32e3f56a5838c6901e94))

### Bug Fixes

- deprecate `next-sanity/studio/loading` ([8e1c1bb](https://github.com/sanity-io/next-sanity/commit/8e1c1bb0c48f78a7c13de39eed449c4b4873dd4d))
- **metadata:** use `next-sanity/studio/metadata` entrypoint ([8da05a1](https://github.com/sanity-io/next-sanity/commit/8da05a1cfb26b92631b721661e3903e78421e283))
- support the `scheme="system"` studio prop ([17ab29c](https://github.com/sanity-io/next-sanity/commit/17ab29c1e4109b6797fe932618fb5c3140d8feff))

## [4.1.8](https://github.com/sanity-io/next-sanity/compare/v4.1.7...v4.1.8) (2023-04-27)

### Bug Fixes

- **deps:** add `@types/styled-components` to peers ([3634dac](https://github.com/sanity-io/next-sanity/commit/3634dac6ae43b2f619d47bdfa1fa72124e55be82))

## [4.1.7](https://github.com/sanity-io/next-sanity/compare/v4.1.6...v4.1.7) (2023-04-12)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v1.4.0 ([#391](https://github.com/sanity-io/next-sanity/issues/391)) ([ad92dd1](https://github.com/sanity-io/next-sanity/commit/ad92dd12a8da984938f3b70f7311794e771e0c4d))

## [4.1.6](https://github.com/sanity-io/next-sanity/compare/v4.1.5...v4.1.6) (2023-03-27)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to v1.3.7 ([#367](https://github.com/sanity-io/next-sanity/issues/367)) ([8a63231](https://github.com/sanity-io/next-sanity/commit/8a6323134b7e66b581ddf28b8eb1a9f9da11ec5e))
- **deps:** update dependency @sanity/preview-kit to v1.3.8 ([#384](https://github.com/sanity-io/next-sanity/issues/384)) ([75ca575](https://github.com/sanity-io/next-sanity/commit/75ca57599147321f963053c2758f492c4059d4aa))

## [4.1.5](https://github.com/sanity-io/next-sanity/compare/v4.1.4...v4.1.5) (2023-02-15)

### Bug Fixes

- **client:** use named `createClient` export ([5c5f1a3](https://github.com/sanity-io/next-sanity/commit/5c5f1a37f8a101fff7403828514b213dcb7b0519))

## [4.1.4](https://github.com/sanity-io/next-sanity/compare/v4.1.3...v4.1.4) (2023-02-15)

### Bug Fixes

- **deps:** update dependency @sanity/client to v5 ([#340](https://github.com/sanity-io/next-sanity/issues/340)) ([8b5af88](https://github.com/sanity-io/next-sanity/commit/8b5af88c62a412633896fd84b2ec0adffc2a2f63))

## [4.1.3](https://github.com/sanity-io/next-sanity/compare/v4.1.2...v4.1.3) (2023-02-14)

### Bug Fixes

- bumping `@sanity/preview-kit` to `1.3.4` ([f8621be](https://github.com/sanity-io/next-sanity/commit/f8621befb2832816f52586b03c46184a46b0e995))

## [4.1.2](https://github.com/sanity-io/next-sanity/compare/v4.1.1...v4.1.2) (2023-01-26)

### Bug Fixes

- **deps:** update devdependencies (non-major) ([#316](https://github.com/sanity-io/next-sanity/issues/316)) ([e5c17f6](https://github.com/sanity-io/next-sanity/commit/e5c17f67a3f8866eab6dada23dbf956b150d7327))

## [4.1.1](https://github.com/sanity-io/next-sanity/compare/v4.1.0...v4.1.1) (2023-01-19)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.3 ([#301](https://github.com/sanity-io/next-sanity/issues/301)) ([f8cd8d2](https://github.com/sanity-io/next-sanity/commit/f8cd8d2f574c0f244cf0b9e37802f98c24fef506))

## [4.1.0](https://github.com/sanity-io/next-sanity/compare/v4.0.6...v4.1.0) (2023-01-17)

### Features

- support modern npm peer deps ([b06546a](https://github.com/sanity-io/next-sanity/commit/b06546a84d0a505f3ed8522735f682d6ce529360))

### Bug Fixes

- improve npm deduping of shared deps ([5fb74ef](https://github.com/sanity-io/next-sanity/commit/5fb74ef08886f45b00eb83b03901d7c9db7562a3))

## [4.0.6](https://github.com/sanity-io/next-sanity/compare/v4.0.5...v4.0.6) (2023-01-14)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.23 ([#297](https://github.com/sanity-io/next-sanity/issues/297)) ([7a3242e](https://github.com/sanity-io/next-sanity/commit/7a3242e773d93ab68a0fe7d3e98d463bc3572a50))

## [4.0.5](https://github.com/sanity-io/next-sanity/compare/v4.0.4...v4.0.5) (2023-01-14)

### Bug Fixes

- **deps:** update dependency groq to ^3.2.3 ([#291](https://github.com/sanity-io/next-sanity/issues/291)) ([d551334](https://github.com/sanity-io/next-sanity/commit/d551334986f4cd6e28a024c71aeed073d1aab89f))

## [4.0.4](https://github.com/sanity-io/next-sanity/compare/v4.0.3...v4.0.4) (2023-01-12)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.22 ([#289](https://github.com/sanity-io/next-sanity/issues/289)) ([fee62dc](https://github.com/sanity-io/next-sanity/commit/fee62dc949d411343228fd79658dac272c712748))

## [4.0.3](https://github.com/sanity-io/next-sanity/compare/v4.0.2...v4.0.3) (2023-01-12)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.21 ([#286](https://github.com/sanity-io/next-sanity/issues/286)) ([09013a8](https://github.com/sanity-io/next-sanity/commit/09013a8601c696ee76d3d2cef3575e553f2ecd58))

## [4.0.2](https://github.com/sanity-io/next-sanity/compare/v4.0.1...v4.0.2) (2023-01-12)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.20 ([#283](https://github.com/sanity-io/next-sanity/issues/283)) ([6a6dbe6](https://github.com/sanity-io/next-sanity/commit/6a6dbe60e97da95db719ba2647a6b6e0d67aca69))

## [4.0.1](https://github.com/sanity-io/next-sanity/compare/v4.0.0...v4.0.1) (2023-01-12)

### Bug Fixes

- **deps:** update dependency groq to v3 ([#280](https://github.com/sanity-io/next-sanity/issues/280)) ([a67ea30](https://github.com/sanity-io/next-sanity/commit/a67ea301b9f6cf9c3b92effa9a141fef4deb7274))

## [4.0.0](https://github.com/sanity-io/next-sanity/compare/v3.1.9...v4.0.0) (2023-01-08)

### ⚠ BREAKING CHANGES

- change `import NextStudioLoading from 'next-sanity/studio/loading'` to `import {NextStudioLoading} from 'next-sanity/studio/loading'`

### Bug Fixes

- add full Node.js ESM runtime support ([ad3ceb7](https://github.com/sanity-io/next-sanity/commit/ad3ceb7262765a89e4138ec61f5ed49fbf7fd7e2))
- **deps:** update dependency @sanity/client to ^4.0.1 ([#267](https://github.com/sanity-io/next-sanity/issues/267)) ([b489987](https://github.com/sanity-io/next-sanity/commit/b48998735045b1723b2da7b0297870d9bf3457f3))
- **deps:** update dependency @sanity/client to v4 ([#262](https://github.com/sanity-io/next-sanity/issues/262)) ([a6ea4f3](https://github.com/sanity-io/next-sanity/commit/a6ea4f3ce35c28796f3ba3ec34dd549ac84220cd))
- **deps:** update dependency @sanity/preview-kit to ^1.2.17 ([#264](https://github.com/sanity-io/next-sanity/issues/264)) ([006fac3](https://github.com/sanity-io/next-sanity/commit/006fac349b4bd7a7d3b725927bc7cb364c4f00ee))
- **deps:** update dependency @sanity/preview-kit to ^1.2.18 ([#270](https://github.com/sanity-io/next-sanity/issues/270)) ([3d15213](https://github.com/sanity-io/next-sanity/commit/3d152138013da5553295b36c71670e4eb0b4bd3e))
- **deps:** update dependency @sanity/preview-kit to ^1.2.19 ([#274](https://github.com/sanity-io/next-sanity/issues/274)) ([ca28e5b](https://github.com/sanity-io/next-sanity/commit/ca28e5b47ae6ca1987516c5814fc03a721c698c5))

### Code Refactoring

- make `NextStudioLoading` a named export ([086de6f](https://github.com/sanity-io/next-sanity/commit/086de6f44b8b5db15fe0470267a2f90ff4c62770))

## [3.1.9](https://github.com/sanity-io/next-sanity/compare/v3.1.8...v3.1.9) (2022-12-30)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.14 ([#250](https://github.com/sanity-io/next-sanity/issues/250)) ([a02246c](https://github.com/sanity-io/next-sanity/commit/a02246c8d8bf93ee0c9635d6b4de0201bc30ae92))
- **deps:** update dependency @sanity/preview-kit to ^1.2.15 ([#259](https://github.com/sanity-io/next-sanity/issues/259)) ([79e375f](https://github.com/sanity-io/next-sanity/commit/79e375f860ff7bdb3b69facd14c267b11881226d))

## [3.1.8](https://github.com/sanity-io/next-sanity/compare/v3.1.7...v3.1.8) (2022-12-23)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.13 ([#247](https://github.com/sanity-io/next-sanity/issues/247)) ([ebdc514](https://github.com/sanity-io/next-sanity/commit/ebdc514e2d2565ed2cfda4f1f76ff9bbb6b1fec6))

## [3.1.7](https://github.com/sanity-io/next-sanity/compare/v3.1.6...v3.1.7) (2022-12-23)

### Bug Fixes

- **deps:** update dependency @sanity/pkg-utils to ^2.0.1 ([#246](https://github.com/sanity-io/next-sanity/issues/246)) ([14b5635](https://github.com/sanity-io/next-sanity/commit/14b563565ec9eacd87663af347078ea6d923f2a3))

## [3.1.6](https://github.com/sanity-io/next-sanity/compare/v3.1.5...v3.1.6) (2022-12-23)

### Bug Fixes

- **deps:** correct peer dependency versions ([#236](https://github.com/sanity-io/next-sanity/issues/236)) ([b24d18c](https://github.com/sanity-io/next-sanity/commit/b24d18cd277019a0cfeb6c90705032137cdec24d))
- **deps:** update dependency @sanity/preview-kit to ^1.2.12 ([#245](https://github.com/sanity-io/next-sanity/issues/245)) ([4482c18](https://github.com/sanity-io/next-sanity/commit/4482c181b913ccbb9f855a93cce66c2b5410c7f0))

## [3.1.5](https://github.com/sanity-io/next-sanity/compare/v3.1.4...v3.1.5) (2022-12-20)

### Bug Fixes

- remove tailwind SVG workaround ([#232](https://github.com/sanity-io/next-sanity/issues/232)) ([b8a2210](https://github.com/sanity-io/next-sanity/commit/b8a2210c7ec8fe46acf96c5025a91897d7654a57))

## [3.1.4](https://github.com/sanity-io/next-sanity/compare/v3.1.3...v3.1.4) (2022-12-18)

### Bug Fixes

- **deps:** update dependency @sanity/preview-kit to ^1.2.11 ([#228](https://github.com/sanity-io/next-sanity/issues/228)) ([50dd890](https://github.com/sanity-io/next-sanity/commit/50dd8908bebb4bd5c244dbc9875c6f0103651896))

## [3.1.3](https://github.com/sanity-io/next-sanity/compare/v3.1.2...v3.1.3) (2022-12-06)

### Bug Fixes

- **deps:** update dependency @sanity/pkg-utils to ^1.20.1 ([#202](https://github.com/sanity-io/next-sanity/issues/202)) ([532ffd7](https://github.com/sanity-io/next-sanity/commit/532ffd72c7ee32a5f5db767fc6f445c451dcbc19))
- **deps:** update dependency @sanity/preview-kit to ^1.2.10 ([#210](https://github.com/sanity-io/next-sanity/issues/210)) ([18b6093](https://github.com/sanity-io/next-sanity/commit/18b6093ff76f202131d7ae13e25f9617cccd0234))

## [3.1.2](https://github.com/sanity-io/next-sanity/compare/v3.1.1...v3.1.2) (2022-11-26)

### Bug Fixes

- make `config` optional in `NextStudioLoading` ([0af6f6c](https://github.com/sanity-io/next-sanity/commit/0af6f6c9be6fdf5094de49a78c66344ad255e3a9))
- make `config` optional in `useTheme` ([6e35ebc](https://github.com/sanity-io/next-sanity/commit/6e35ebcee0659d0dc45e05db945119ed0232ba01))

## [3.1.1](https://github.com/sanity-io/next-sanity/compare/v3.1.0...v3.1.1) (2022-11-25)

### Bug Fixes

- show "Loading..." text over spinner ([6082652](https://github.com/sanity-io/next-sanity/commit/60826520db924046b4889f1df69f02a3a921cf02))

## [3.1.0](https://github.com/sanity-io/next-sanity/compare/v3.0.5...v3.1.0) (2022-11-25)

### Features

- add `next-sanity/studio/loading` ([#196](https://github.com/sanity-io/next-sanity/issues/196)) ([575964d](https://github.com/sanity-io/next-sanity/commit/575964df5e5e1c6247ee06bc6d0cf271e4bc64a5))

## [3.0.5](https://github.com/sanity-io/next-sanity/compare/v3.0.4...v3.0.5) (2022-11-25)

### Bug Fixes

- add temp workaround for RSC compat ([1166b61](https://github.com/sanity-io/next-sanity/commit/1166b61331b96bb5470351f9f8c55d649b94d500))
- call `store.close` on `beforeunload` ([#195](https://github.com/sanity-io/next-sanity/issues/195)) ([e7b9bf6](https://github.com/sanity-io/next-sanity/commit/e7b9bf60f9751abbe05c6cd86d4d33cb3147e219))
- **docs:** Next 13 RSC auto code split client components ([80c2918](https://github.com/sanity-io/next-sanity/commit/80c29182fb3e723261cdcf929b44206661d85444))

## [3.0.4](https://github.com/sanity-io/next-sanity/compare/v3.0.3...v3.0.4) (2022-11-24)

### Bug Fixes

- set the webhooks runtime to `nodejs` by default ([1cf0a72](https://github.com/sanity-io/next-sanity/commit/1cf0a7295c5e5b4526d0e010936069e9787bca63))

## [3.0.3](https://github.com/sanity-io/next-sanity/compare/v3.0.2...v3.0.3) (2022-11-24)

### Bug Fixes

- set `key` prop on favicon links ([edde50a](https://github.com/sanity-io/next-sanity/commit/edde50a28ec57f6463d67d028922dbd8dca56953))

## [3.0.2](https://github.com/sanity-io/next-sanity/compare/v3.0.1...v3.0.2) (2022-11-22)

### Bug Fixes

- wait for eventual consistency by default ([d76f111](https://github.com/sanity-io/next-sanity/commit/d76f111b4dc11a2337dd177f206641ffb4add7cd))

## [3.0.1](https://github.com/sanity-io/next-sanity/compare/v3.0.0...v3.0.1) (2022-11-22)

### Bug Fixes

- add `<meta charset="utf-8">` in Next 13 ([a4e9e1a](https://github.com/sanity-io/next-sanity/commit/a4e9e1aa3e8fcb9495767f7360cea612f0cc6b68))
- don't negate `unstable__tailwindSvgFix` ([c6c540b](https://github.com/sanity-io/next-sanity/commit/c6c540bd51d88a72afc1d69e071a848d8498118e))

## [3.0.0](https://github.com/sanity-io/next-sanity/compare/v2.1.0...v3.0.0) (2022-11-22)

### ⚠ BREAKING CHANGES

- See the [Migration section in the README](https://github.com/sanity-io/next-sanity/tree/main#from-v2) for details.

### Features

- add support for Next 13 `appDir` ([#184](https://github.com/sanity-io/next-sanity/issues/184)) ([0c80876](https://github.com/sanity-io/next-sanity/commit/0c80876ae1496cfb7f8cc6e27ef3537a82fcea15)), closes [/github.com/sanity-io/next-sanity/tree/main#from-v2](https://github.com/sanity-io//github.com/sanity-io/next-sanity/tree/main/issues/from-v2)

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