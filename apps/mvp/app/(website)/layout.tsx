// oxlint-disable-next-line no-unassigned-import
import '../globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {SanityLive} from './live'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        {(await draftMode()).isEnabled && <VisualEditing />}
        <SanityLive />
      </body>
    </html>
  )
}
