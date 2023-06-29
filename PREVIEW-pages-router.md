# Setup Live Previews in `pages-router`

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

### `pages/index.tsx`

```tsx
import {DocumentsCount, query} from 'components/DocumentsCount'
import {getClient} from 'lib/sanity.client'

export const getStaticProps = async (context) => {
  const {token} = context.previewData ?? {}
  const preview = context.preview ? {token} : undefined
  const client = getClient(preview)

  const data = await client.fetch(query)
  return {props: {data}}
}

export default function IndexPage({data}) {
  return <DocumentsCount data={data} />
}
```

## After

### `pages/index.tsx`

```tsx
import {DocumentsCount, query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import PreviewProvider from 'components/PreviewProvider'
import {getClient} from 'lib/sanity.client'

export const getStaticProps = async (context) => {
  const {token} = context.previewData ?? {}
  const preview = context.preview ? {token} : undefined
  const client = getClient(preview)

  const data = await client.fetch(query)
  return {props: {preview, data}}
}

export default function IndexPage({preview, data}) {
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
import {useLiveQuery} from 'next-sanity/preview'
import {query, DocumentsCount} from 'components/DocumentsCount'

export default function PreviewDocumentsCount({data: initialData}) {
  const [data] = useLiveQuery(initialData, query)

  return <DocumentsCount data={data} />
}
```

### `components/PreviewProvider.tsx`

```tsx
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
