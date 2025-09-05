## Migrate

### The `next-sanity/preview`, and `next-sanity/preview/live-query`, exports has been removed

These exports were used to implement live preview of draft content, and comes from the `@sanity/preview-kit` library, which is no longer actively developed.

You have 3 migration options:

1. [Use the Live Content API end to end (recommended)](#migrate-to-the-live-content-api-end-to-end)
2. [Use the Live Content API just for draft content](#progressively-adopt-the-live-content-api-to-drive-draft-content-live-preview)
3. [Use the `@sanity/preview-kit` library (not recommended)](#migrate-to-the-sanitypreview-kit-library)

#### Migrate to the Live Content API end to end

The recommended way to preview drafts is to use the [Live Content API][live-content-api].
It supports live preview of draft content out of the box.
Here's an example migration, [based on the setup guide for live preview in v9](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#setup-live-previews-in-app-router).

Create a `lib/sanity.client.ts` file with the following content:

```ts
import {defineLive} from 'next-sanity/live'

import {client} from './sanity.client'

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
```

[Change `app/layout.tsx` to no longer wrap the children in a `PreviewProvider`, instead the `SanityLive` component renders at the bottom](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#applayouttsx-1):

```diff
-import dynamic from 'next/dynamic'
-import {draftMode} from 'next/headers'
-import {token} from 'lib/sanity.fetch'
+import {SanityLive} from 'lib/sanity.live'

-const PreviewProvider = dynamic(() => import('components/PreviewProvider'))

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
-        {(await draftMode()).isEnabled ? (
-          <PreviewProvider token={token}>{children}</PreviewProvider>
-        ) : (
-          children
-        )}
+        {children}
+        <SanityLive />
      </body>
    </html>
  )
}
```

[Update `app/page.tsx` to use the new `sanityFetch` function exported by `defineLive`](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#apppagetsx-1):

```diff
-import {draftMode} from 'next/headers'
-import {LiveQuery} from 'next-sanity/preview/live-query'
 import DocumentsCount, {query} from 'components/DocumentsCount'
-import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
-import {sanityFetch} from 'lib/sanity.fetch'
+import {sanityFetch} from 'lib/sanity.live'

export default async function IndexPage() {
- const data = await sanityFetch<number>({query, tags: ['post']})
+ const {data} = await sanityFetch({query})

  return (
-   <LiveQuery
-     enabled={draftMode().isEnabled}
-     query={query}
-     initialData={data}
-     as={PreviewDocumentsCount}
-   >
      <DocumentsCount data={data} />
-   </LiveQuery>
  )
}
```

These can be deleted as they're not needed anymore.

- `lib/sanity.fetch.ts`
- `components/PreviewDocumentsCount.tsx`
- `components/PreviewProvider.tsx`

#### Progressively adopt the Live Content API to drive draft content live preview

Adopting the [Live Content API][live-content-api] end to end means your app will be live and rerender to any changes to published content. Most apps can't adopt such a setup without also refactoring the user experience to account for unwanted layout shifts.

In the meantime you can progressively adopt the [Live Content API][live-content-api] to drive just the draft content live preview.

Here's an example migration, [based on the setup guide for live preview in v9](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#setup-live-previews-in-app-router).

Create a `lib/sanity.client.ts` file with the following content:

```ts
import {defineLive} from 'next-sanity/live'

import {client} from './sanity.client'

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN')
}

export const {sanityFetch: sanityLiveFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
```

[Change `app/layout.tsx` to no longer wrap the children in a `PreviewProvider`, instead the `SanityLive` component renders at the bottom when draft mode is enabled](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#applayouttsx-1):

```diff
-import dynamic from 'next/dynamic'
 import {draftMode} from 'next/headers'
-import {token} from 'lib/sanity.fetch'
+import {SanityLive} from 'lib/sanity.live'

-const PreviewProvider = dynamic(() => import('components/PreviewProvider'))

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
-        {(await draftMode()).isEnabled ? (
-          <PreviewProvider token={token}>{children}</PreviewProvider>
-        ) : (
-          children
-        )}
+        {children}
+        {(await draftMode()).isEnabled && <SanityLive />}
      </body>
    </html>
  )
}
```

Then delete `components/PreviewProvider.tsx` as it's not needed anymore.

[Update `lib/sanity.fetch.ts` to use the new `sanityLiveFetch` function exported by `defineLive` when in draft mode](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#libsanityfetchts):

```diff
import 'server-only'

import {draftMode} from 'next/headers'
import type {QueryOptions, QueryParams} from 'next-sanity'

import {client} from './sanity.client'
+import {sanityLiveFetch} from './sanity.live'

-export const token = process.env.SANITY_API_READ_TOKEN

export async function sanityFetch<QueryResponse>({
  query,
  params = {},
  tags,
}: {
  query: string
  params?: QueryParams
  tags?: string[]
}) {
  const isDraftMode = (await draftMode()).isEnabled
- if (isDraftMode && !token) {
-   throw new Error('The `SANITY_API_READ_TOKEN` environment variable is required.')
- }
+ if (isDraftMode) {
+   const {data} = await sanityLiveFetch({query, params, tags})
+   return data
+ }

  return client.fetch<QueryResponse>(query, params, {
-   ...(isDraftMode &&
-     ({
-       token: token,
-       perspective: 'drafts',
-     } satisfies QueryOptions)),
    next: {
-     revalidate: isDraftMode ? 0 : false,
+     revalidate: false
      tags,
    },
  })
}
```

[Update `app/page.tsx` to no longer use the `LiveQuery` component](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#apppagetsx-1):

```diff
import {draftMode} from 'next/headers'
-import {LiveQuery} from 'next-sanity/preview/live-query'
import DocumentsCount, {query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import {sanityFetch} from 'lib/sanity.fetch'

export default async function IndexPage() {
  const data = await sanityFetch<number>({query, tags: ['post']})
+
+ if((await draftMode()).isEnabled) {
+   return <PreviewDocumentsCount data={data} />
+ }

  return (
-   <LiveQuery
-     enabled={draftMode().isEnabled}
-     query={query}
-     initialData={data}
-     as={PreviewDocumentsCount}
-   >
      <DocumentsCount data={data} />
-   </LiveQuery>
  )
}
```

[Lastly, update the `components/PreviewDocumentsCount.tsx` to use the new `usePresentationQuery` hook](https://github.com/sanity-io/next-sanity/blob/v9/packages/next-sanity/PREVIEW-app-router.md#componentspreviewdocumentscounttsx):

```diff
'use client'

import dynamic from 'next/dynamic'
+import {usePresentationQuery} from 'next-sanity/hooks'
+import {query} from './DocumentsCount'

+const DocumentsCount = dynamic(() => import('./DocumentsCount'))

-// Re-exported components using next/dynamic ensures they're not bundled
-// and sent to the browser unless actually used, with draftMode().enabled.
+export default function PreviewDocumentsCount(props: React.ComponentProps<typeof DocumentsCount>) {
+  const optimistic = usePresentationQuery({query})
+  return <DocumentsCount {...props} data={optimistic.data || props.data} />
+}
-export default dynamic(() => import('./DocumentsCount'))
```

#### Migrate to the `@sanity/preview-kit` library

This is the easiest way to migrate to `next-sanity` v10, but it's not recommended for new projects since `@sanity/preview-kit` is not actively developed.

```bash
npm install @sanity/preview-kit
```

```diff
 import {
   LiveQuery,
   type LiveQueryProps,
-} from 'next-sanity/preview/live-query'
+} from '@sanity/preview-kit/live-query'

 import {
   LiveQueryProvider,
   useLiveQuery,
   type LiveQueryProviderProps
-} from 'next-sanity/preview'
+} from '@sanity/preview-kit'
```

[live-content-api]: https://github.com/sanity-io/next-sanity?tab=readme-ov-file#live-content-api
