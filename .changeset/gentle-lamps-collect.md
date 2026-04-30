---
'next-sanity': minor
---

Change `<VisualEditing>`'s default refresh behavior for document mutations to only call `router.refresh()`, and no longer call `revalidatePath('/', 'layout')` by default.

Technically this is a breaking change for apps relying on the previous default root layout revalidation. However, because of the Next.js regression reported by Sanity to Vercel in https://github.com/vercel/next.js/issues/93210, we feel strongly that the default behavior in `<VisualEditing>` on document mutations needs to avoid `revalidatePath('/', 'layout')`: calling it worsens the impact of the regression by causing many `CACHE: REVALIDATED` events, which can massively increase ISR Writes.

The previous behavior can be restored by providing a custom `refresh` prop to `<VisualEditing>` that calls `revalidatePath('/', 'layout')`:

```tsx
import {draftMode} from 'next/headers'
import {refresh, revalidatePath} from 'next/cache'
import {VisualEditing} from 'next-sanity/visual-editing'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        {isDraftMode && (
          <VisualEditing
            refresh={async function refreshVisualEditing(payload) {
              'use server'
              switch (payload.source) {
                // When clicking the refresh button manually in Presentation Tool we purge the cache
                case 'manual':
                  return revalidatePath('/', 'layout')
                // When a document is edited we just refresh
                case 'mutation':
                  return refresh()
                default:
                  throw new Error('Unknown refresh source', {cause: payload})
              }
            }}
          />
        )}
      </body>
    </html>
  )
}
```
