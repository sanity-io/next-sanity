import '../globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        {(await draftMode()).isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
