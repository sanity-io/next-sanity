# Migrate from `v4` to `v5` in `app-router`

> This guide tries to keep it as simple as possible, there's a more comprehensive guide [here](https://github.com/sanity-io/preview-kit/blob/main/MIGRATION.md)

When migrating there are 4 main changes:

1. `usePreview` is replaced with `useLiveQuery`.
2. `definePreview` is replaced with a custom `PreviewProvider` that configures `LiveQueryProvider`.
3. `PreviewSuspense` is removed.
4. The `useLiveQuery` hook is used to render a fallback UI (Spinner) instead of a `<Suspense fallback={...}>` component.

Let's look at a simple app using `v4`, and then walk through how to migrate it to `v5`.

## Before

### `app/page.tsx`

```tsx
import {draftMode} from 'next/headers'
import {PreviewSuspense} from 'next-sanity/preview'
import {DocumentsCount, query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import {getClient} from 'lib/sanity.client'

export default async function IndexPage() {
  const preview = draftMode().isEnabled ? {token: process.env.SANITY_API_READ_TOKEN} : undefined
  const client = getClient(preview)

  const data = preview ? null : await client.fetch(query)

  if (preview) {
    return (
      <PreviewSuspense fallback="Loading...">
        <PreviewDocumentsCount token={preview.token} />
      </PreviewSuspense>
    )
  }

  return <DocumentsCount data={data} />
}
```

### `components/PreviewDocumentsCount.tsx`:

```tsx
'use client'

import {query, DocumentsCount} from 'components/DocumentsCount'
import {usePreview} from 'lib/sanity.preview'

export default function PreviewDocumentsCount({token}) {
  const data = usePreview(token, query)
  return <DocumentsCount data={data} />
}
```

### `lib/sanity.preview.ts`

```js
'use client'

import {definePreview} from 'next-sanity/preview'
import {getClient} from 'lib/sanity.client'

const {projectId, dataset} = getClient().config()
export const usePreview = definePreview({projectId, dataset})
```

## After

### `app/page.tsx`

```tsx
import {draftMode} from 'next/headers'
import {DocumentsCount, query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import PreviewProvider from 'components/PreviewProvider'
import {getClient} from 'lib/sanity.client'

export default async function IndexPage() {
  const preview = draftMode().isEnabled ? {token: process.env.SANITY_API_READ_TOKEN} : undefined

  const data = await client.fetch(query)

  if (preview) {
    return (
      <PreviewProvider token={preview.token}>
        <PreviewDocumentsCount data={data} />
      </PreviewProvider>
    )
  }

  return <DocumentsCount data={data} />
}
```

### `components/PreviewDocumentsCount.tsx`:

```tsx
'use client'

import {useLiveQuery} from 'next-sanity/preview'
import {query, DocumentsCount} from 'components/DocumentsCount'

export default function PreviewDocumentsCount({data: initialData}) {
  const [data, loading] = useLiveQuery(initialData, query)

  if (loading) {
    return <>Loading...</>
  }

  return <DocumentsCount data={data} />
}
```

### `components/PreviewProvider.tsx`

```tsx
'use client'

import {useMemo} from 'react'
import {LiveQueryProvider} from 'next-sanity/preview'
import {getClient} from 'lib/sanity.client'

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  const client = useMemo(() => getClient({token}), [token])
  return <LiveQueryProvider client={client}>{children}</LiveQueryProvider>
}
```
