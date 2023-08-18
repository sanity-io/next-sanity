# Setup Live Previews in `pages-router`

```bash
npm i @sanity/client@latest next-sanity@latest
```

### `lib/sanity.client.ts`

```tsx
import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2022-11-15',
  useCdn: false,
  perspective: 'published',
})
```

### `lib/sanity.fetch.ts`

```tsx
import type {QueryParams} from '@sanity/client'

import {client} from './sanity.client'

export const token = process.env.SANITY_API_READ_TOKEN

const DEFAULT_PARAMS = {} as QueryParams

export async function sanityFetch<QueryResponse>({
  draftMode,
  query,
  params = DEFAULT_PARAMS,
}: {
  draftMode: boolean
  query: string
  params?: QueryParams
}): Promise<QueryResponse> {
  if (draftMode && !token) {
    throw new Error('The `SANITY_API_READ_TOKEN` environment variable is required.')
  }

  return client.fetch<QueryResponse>(query, params, {
    token,
    perspective: draftMode ? 'previewDrafts' : 'published',
  })
}
```

### `components/DocumentsCount.tsx`:

```tsx
export const query = `count(*[_type == "page"])`

export function DocumentsCount({data}: {data: number}) {
  return <div>There are {data} documents</div>
}
```

## Before

### `pages/_app.tsx`

```tsx
import {AppProps} from 'next/app'

export default function App({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />
}
```

### `pages/index.tsx`

```tsx
import {DocumentsCount, query} from 'components/DocumentsCount'
import {sanityFetch} from 'lib/sanity.fetch'

export const getStaticProps = async ({draftMode = false}) => {
  const data = await sanityFetch({draftMode, query})
  return {props: {data}}
}

export default function IndexPage({data}) {
  return <DocumentsCount data={data} />
}
```

## After

### `pages/_app.tsx`

```tsx
import {AppProps} from 'next/app'
import dynamic from 'next/dynamic'

const PreviewProvider = dynamic(() => import('components/PreviewProvider'))

export default function App({
  Component,
  pageProps,
}: AppProps<{
  draftMode: boolean
  token: string
}>) {
  const {draftMode, token} = pageProps
  return draftMode ? (
    <PreviewProvider token={token}>
      <Component {...pageProps} />
    </PreviewProvider>
  ) : (
    <Component {...pageProps} />
  )
}
```

### `pages/index.tsx`

```tsx
import {LiveQuery} from 'next-sanity/preview/live-query'
import {DocumentsCount, query} from 'components/DocumentsCount'
import {sanityFetch, token} from 'lib/sanity.fetch'

export const getStaticProps = async ({draftMode}) => {
  const data = await sanityFetch({draftMode, query})
  return {props: {draftMode, token: draftMode ? token : '', data}}
}

export default function IndexPage({draftMode, data}) {
  return (
    <LiveQuery enabled={draftMode} query={query} initialData={data}>
      <DocumentsCount data={data} />
    </LiveQuery>
  )
}
```

### `components/PreviewProvider.tsx`

```tsx
import {LiveQueryProvider} from 'next-sanity/preview'
import {client} from 'lib/sanity.client'

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token?: string
}) {
  if (!token) throw new TypeError('Missing token')
  return (
    <LiveQueryProvider client={client} token={token} logger={console}>
      {children}
    </LiveQueryProvider>
  )
}
```
