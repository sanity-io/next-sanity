---
'next-sanity': minor
---

Change `<SanityLive />`'s default `revalidateSyncTags` behavior so draft mode revalidates affected Sanity tags with `revalidateTag(tag, 'max')`, instead of expiring them immediately with `revalidateTag(tag, {expire: 0})`.

Technically this is a breaking change for apps relying on the previous immediate tag expiry behavior. However, because of the Next.js regression reported by Sanity to Vercel in https://github.com/vercel/next.js/issues/93210, we feel strongly that the default behavior in `<SanityLive />` needs to avoid `revalidateTag(tag, {expire: 0})` in draft mode: calling it worsens the impact of the regression by causing many `CACHE: REVALIDATED` events, which can massively increase ISR Writes.

The previous behavior can be restored by providing a custom `revalidateSyncTags` prop to `<SanityLive />`:

```tsx
import type {SyncTag} from '@sanity/client'
import {revalidateTag} from 'next/cache'

import {SanityLive} from '@/sanity/live'

async function revalidateSyncTags(tags: SyncTag[]): Promise<void> {
  'use server'

  revalidateTag('sanity:fetch-sync-tags', 'max')

  for (const _tag of tags) {
    revalidateTag(`sanity:${_tag}`, {expire: 0})
  }
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive revalidateSyncTags={revalidateSyncTags} />
      </body>
    </html>
  )
}
```
