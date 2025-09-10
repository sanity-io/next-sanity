## Migrate

### The `VisualEditing` export has been moved to `next-sanity/visual-editing`

The export has been moved to support `output: 'static'` builds. `VisualEditing` makes use of Server Actions, and thus it cannot be exposed to the root `'next-sanity'` export without blocking the ability to use features like `import {defineQuery} from 'next-sanity'` on static builds.

```diff
// src/app/layout.tsx

-import {VisualEditing} from 'next-sanity'
+import {VisualEditing} from 'next-sanity/visual-editing'
import {SanityLive} from '@/sanity/lib/live'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {(await draftMode()).isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
```

### The `defineLive` export has been moved to `next-sanity/live`

The export has been moved to support `output: 'static'` builds. `defineLive` makes use of Server Actions, and thus it cannot be exposed to the root `'next-sanity'` export without blocking the ability to use features like `import {defineQuery} from 'next-sanity'` on static builds.

```diff
// src/sanity/lib/live.ts

import {createClient} from 'next-sanity'
-import {defineLive} from 'next-sanity'
+import {defineLive} from 'next-sanity/live'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: true,
  apiVersion: 'v2025-03-04',
  stega: {studioUrl: '/studio'},
})

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

### The `isCorsOriginError` export has been moved to `next-sanity/live`

```diff
'use client'

-import {isCorsOriginError} from 'next-sanity'
+import {isCorsOriginError} from 'next-sanity/live'
import {toast} from 'sonner'

export function handleError(error: unknown) {
  if (isCorsOriginError(error)) {
    const {addOriginUrl} = error
    toast.error(`Sanity Live couldn't connect`, {
      description: `Your origin is blocked by CORS policy`,
      duration: Infinity,
      action: addOriginUrl
        ? {
            label: 'Manage',
            onClick: () => window.open(addOriginUrl.toString(), '_blank'),
          }
        : undefined,
    })
  } else if (error instanceof Error) {
    console.error(error)
    toast.error(error.name, {description: error.message, duration: Infinity})
  } else {
    console.error(error)
    toast.error('Unknown error', {
      description: 'Check the console for more details',
      duration: Infinity,
    })
  }
}
```

