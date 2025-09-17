// oxlint-disable-next-line no-unassigned-import
import '../globals.css'

import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {SanityLive} from './live'
import {resolveCookiePerspective} from 'next-sanity/live/use-cache'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const perspective = await resolveCookiePerspective()
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        {(await draftMode()).isEnabled && <VisualEditing />}
        <SanityLive draftModePerspective={perspective} />
      </body>
    </html>
  )
}
