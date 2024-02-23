import './globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity'

import ConditionalPreviewProvider from './ConditionalPreviewProvider'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        <ConditionalPreviewProvider>{children}</ConditionalPreviewProvider>
        {draftMode().isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
