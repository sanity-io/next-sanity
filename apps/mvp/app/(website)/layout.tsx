import '../globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity'

import {SanityLive} from './live'
import {revalidateTag} from 'next/cache'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        {(await draftMode()).isEnabled && <VisualEditing />}
        <SanityLive
          // Only revalidate when changes to tags currently being rendered
          revalidateSyncTags={async (tags) => {
            'use server'

            for (const tag of tags) {
              await revalidateTag(`sanity:${tag}`)
            }
          }}
        />
      </body>
    </html>
  )
}
