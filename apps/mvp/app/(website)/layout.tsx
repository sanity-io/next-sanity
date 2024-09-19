import '../globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity'

import {handleDraftModeAction} from './actions'
import {SanityLive} from './live'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        {draftMode().isEnabled && <VisualEditing />}
        <SanityLive handleDraftModeAction={handleDraftModeAction} ignoreBrowserTokenWarning />
      </body>
    </html>
  )
}
