# Setup Live Previews in `app-router`

### `lib/sanity.client.ts`

```tsx
import {createClient, type SanityClient} from 'next-sanity'

export function getClient({preview}: {preview?: {token: string}}): SanityClient {
  const client = createClient({
    projectId: 'your-project-id',
    dataset: 'production',
    apiVersion: '2023-06-20',
    useCdn: true,
    perspective: 'published',
  })
  if (preview) {
    if (!preview.token) {
      throw new Error('You must provide a token to preview drafts')
    }
    return client.withConfig({
      token: preview.token,
      useCdn: false,
      ignoreBrowserTokenWarning: true,
      perspective: 'previewDrafts',
    })
  }
  return client
}
```

## Before

### `app/page.tsx`

```tsx
import {draftMode} from 'next/headers'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {getClient} from 'lib/sanity.client'

export default async function IndexPage() {
  const preview = draftMode().isEnabled ? {token: process.env.SANITY_API_READ_TOKEN} : undefined

  const data = await client.fetch(query)

  return <DocumentsCount data={data} />
}
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
  const [data] = useLiveQuery(initialData, query)

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
