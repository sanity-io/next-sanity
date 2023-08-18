# Setup Live Previews in `app-router`

```bash
npm i @sanity/client@latest next-sanity@latest server-only suspend-react
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
import 'server-only'

import type {QueryParams} from '@sanity/client'
import {draftMode} from 'next/headers'

import {client} from './sanity.client'

export const token = process.env.SANITY_API_READ_TOKEN

const DEFAULT_PARAMS = {} as QueryParams
const DEFAULT_TAGS = [] as string[]

export async function sanityFetch<QueryResponse>({
  query,
  params = DEFAULT_PARAMS,
  tags = DEFAULT_TAGS,
}: {
  query: string
  params?: QueryParams
  tags: string[]
}): Promise<QueryResponse> {
  const isDraftMode = draftMode().isEnabled
  if (isDraftMode && !token) {
    throw new Error('The `SANITY_API_READ_TOKEN` environment variable is required.')
  }

  return client.fetch<QueryResponse>(query, params, {
    cache: 'force-cache',
    ...(isDraftMode && {
      cache: undefined,
      token: token,
      perspective: 'previewDrafts',
    }),
    next: {
      ...(isDraftMode && {revalidate: 30}),
      tags,
    },
  })
}
```

### `components/DocumentsCount.tsx`:

```tsx
export const query = `count(*[_type == "page"])`

export default function DocumentsCount({data}: {data: number}) {
  return <div>There are {data} documents</div>
}
```

## Before

### `app/layout.tsx`

```tsx
export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### `app/page.tsx`

```tsx
import DocumentsCount, {query} from 'components/DocumentsCount'
import {sanityFetch} from 'lib/sanity.fetch'

export default async function IndexPage() {
  const data = await sanityFetch<number>({query, tags: ['post']})

  return <DocumentsCount data={data} />
}
```

## After

### `app/layout.tsx`

```tsx
import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'
import {token} from 'lib/sanity.fetch'

const PreviewProvider = dynamic(() => import('components/PreviewProvider'))

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {draftMode().isEnabled ? (
          <PreviewProvider token={token}>{children}</PreviewProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
```

### `app/page.tsx`

```tsx
import {draftMode} from 'next/headers'
import {LiveQuery} from 'next-sanity/preview/live-query'
import DocumentsCount, {query} from 'components/DocumentsCount'
import PreviewDocumentsCount from 'components/PreviewDocumentsCount'
import {sanityFetch} from 'lib/sanity.fetch'

export default async function IndexPage() {
  const preview = draftMode().isEnabled ? {token: process.env.SANITY_API_READ_TOKEN} : undefined

  const data = await sanityFetch<number>({query, tags: ['post']})

  return (
    <LiveQuery
      enabled={draftMode().isEnabled}
      query={query}
      initialData={data}
      as={PreviewDocumentsCount}
    >
      <DocumentsCount data={data} />
    </LiveQuery>
  )
}
```

### `components/PreviewDocumentsCount.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'

// Re-exported components using next/dynamic ensures they're not bundled
// and sent to the browser unless actually used, with draftMode().enabled.

export default dynamic(() => import('./DocumentsCount'))
```

### `components/PreviewProvider.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'
import {suspend} from 'suspend-react'

const LiveQueryProvider = dynamic(() => import('next-sanity/preview'))

// suspend-react cache is global, so we use a unique key to avoid collisions
const UniqueKey = Symbol('lib/sanity.client')

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token?: string
}) {
  const {client} = suspend(() => import('lib/sanity.client'), [UniqueKey])
  if (!token) throw new TypeError('Missing token')
  return (
    <LiveQueryProvider client={client} token={token} logger={console}>
      {children}
    </LiveQueryProvider>
  )
}
```
