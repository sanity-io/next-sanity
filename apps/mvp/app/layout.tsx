import './globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        {draftMode().isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
