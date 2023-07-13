## Migrate

- [From `v2`](#from-v2)
- [From `v1`](#from-v1)
- [From `v0.4`](#from-v04)

### From `v2`

The `v3` release only contains breaking changes on the `next-sanity/studio` imports. If you're only using `import {createClient, groq} from 'next-sanity'` or `import {definePreview, PreviewSuspense} from 'next-sanity/preview'` then there's no migration for you to do.

#### `NextStudioGlobalStyle` is removed

The layout is no longer using global CSS to set the Studio height. The switch to local CSS helps interop between Next `/pages` and `/app` layouts.

#### `ServerStyleSheetDocument` is removed

It's no longer necessary to setup `styled-components` SSR for the Studio to render correctly.

#### The internal `isWorkspaceWithTheme` and `isWorkspaces` utils are no longer exported

The `useTheme` hook is still available if you're building abstractions that need to know what the initial workspace theme variables are.

#### The `useBackgroundColorsFromTheme`, `useBasePath`, `useConfigWithBasePath`, and `useTextFontFamilyFromTheme`, hooks are removed

You can `useTheme` to replace `useBackgroundColorsFromTheme` and `useTextFontFamilyFromTheme`:

```tsx
import {useMemo} from 'react'
import {useTheme} from 'next-sanity/studio'
import type {StudioProps} from 'sanity'
export default function MyComponent(props: Pick<StudioProps, 'config'>) {
  const theme = useTheme(config)
  // useBackgroundColorsFromTheme
  const {themeColorLight, themeColorDark} = useMemo(
    () => ({
      themeColorLight: theme.color.light.default.base.bg,
      themeColorDark: theme.color.dark.default.base.bg,
    }),
    [theme],
  )
  // useTextFontFamilyFromTheme
  const fontFamily = useMemo(() => theme.fonts.text.family, [theme])
}
```

The reason why `useBasePath` and `useConfigWithBasePath` got removed is because Next `/pages` and `/app` diverge too much in how they declare dynamic segments. Thus you'll need to specify `basePath` in your `sanity.config.ts` manually to match the route you're loading the studio, for the time being.

#### The `NextStudioHead` component has moved from `next-sanity/studio` to `next-sanity/studio/head`

Its props are also quite different and it now requires you to wrap it in `import Head from 'next/head'` if you're not using a `head.tsx` in `appDir`. Make sure you use TypeScript to ease the migration.

### From `v1`

#### `createPreviewSubscriptionHook` is replaced with `definePreview`

There are several differences between the hooks. First of all, `definePreview` requires React 18 and Suspense. And as it's designed to work with React Server Components you provide `token` in the hook itself instead of in the `definePreview` step. Secondly, `definePreview` encourages code-splitting using `React.lazy` and that means you only call the `usePreview` hook in a component that is lazy loaded. Quite different from `usePreviewSubscription` which was designed to be used in both preview mode, and in production by providing `initialData`.

##### Before

The files that are imported here are the same as the [Next `/pages` example](#using-the-pages-director).

`pages/index.tsx`

```tsx
import {createPreviewSubscriptionHook} from 'next-sanity'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {client, projectId, dataset} from 'lib/sanity.client'

export const getStaticProps = async ({preview = false}) => {
  const data = await client.fetch(query)

  return {props: {preview, data}}
}

const usePreviewSubscription = createPreviewSubscriptionHook({projectId, dataset})
export default function IndexPage({preview, data: initialData}) {
  const {data} = usePreviewSubscription(indexQuery, {initialData, enabled: preview})
  return <DocumentsCount data={data} />
}
```

##### After

`components/PreviewDocumentsCount.tsx`

```tsx
import {definePreview} from 'next-sanity/preview'
import {projectId, dataset} from 'lib/sanity.client'

const usePreview = definePreview({projectId, dataset})
export default function PreviewDocumentsCount() {
  const data = usePreview(null, query)
  return <DocumentsCount data={data} />
}
```

`pages/index.tsx`

```tsx
import {lazy} from 'react'
import {PreviewSuspense} from 'next-sanity/preview'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {client} from 'lib/sanity.client'

const PreviewDocumentsCount = lazy(() => import('components/PreviewDocumentsCount'))

export const getStaticProps = async ({preview = false}) => {
  const data = await client.fetch(query)

  return {props: {preview, data}}
}

export default function IndexPage({preview, data}) {
  if (preview) {
    return (
      <PreviewSuspense fallback={<DocumentsCount data={data} />}>
        <PreviewDocumentsCount />
      </PreviewSuspense>
    )
  }
  return <DocumentsCount data={data} />
}
```

#### `createCurrentUserHook` is removed

If you used this hook to check if the user is cookie authenticated:

```tsx
import {createCurrentUserHook} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const useCurrentUser = createCurrentUserHook({projectId})
const useCheckAuth = () => {
  const {data, loading} = useCurrentUser()
  return loading ? false : !!data
}

export default function Page() {
  const isAuthenticated = useCheckAuth()
}
```

Then you can achieve the same functionality using `@sanity/preview-kit` and `suspend-react`:

```tsx
import {suspend} from 'suspend-react'
import {_checkAuth} from '@sanity/preview-kit'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const useCheckAuth = () =>
  suspend(() => _checkAuth(projectId, null), ['@sanity/preview-kit', 'checkAuth', projectId])

export default function Page() {
  const isAuthenticated = useCheckAuth()
}
```

### From `v0.4`

#### `createPortableTextComponent` is removed

This utility used to wrap `@sanity/block-content-to-react`. It's encouraged to upgrade to `@portabletext/react`.

```sh
$ npm install @portabletext/react
// or
$ yarn add @portabletext/react
```

```diff
-import { createPortableTextComponent } from 'next-sanity'
+import { PortableText as PortableTextComponent } from '@portabletext/react'

-export const PortableText = createPortableTextComponent({ serializers: {} })
+export const PortableText = (props) => <PortableTextComponent components={{}} {...props} />
```

Please note that the `serializers` and `components` are not 100% equivalent.

[Check the full migration guide.](https://github.com/portabletext/react-portabletext/blob/main/MIGRATING.md)

#### `createImageUrlBuilder` is removed

This utility is no longer wrapped by `next-sanity` and you'll need to install the dependency yourself:

```sh
$ npm install @sanity/image-url
// or
$ yarn add @sanity/image-url
```

```diff
-import { createImageUrlBuilder } from 'next-sanity'
+import createImageUrlBuilder from '@sanity/image-url'
```
