'use cache'

// oxlint-disable-next-line no-unassigned-import
import '../globals.css'

import {
  // cookies,
  draftMode,
} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {SanityLive} from './live'
import {FormStatusLabel} from './FormStatus'
import {DebugStatus} from './DebugStatus'
import {RefreshButton} from './RefreshButton'
// import {resolvePerspectiveFromCookies} from 'next-sanity/experimental/live'
// import {Suspense} from 'react'

async function toggleDraftMode() {
  'use server'

  const draft = await draftMode()

  if (draft.isEnabled) {
    draft.disable()
  } else {
    draft.enable()
  }
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled
  return (
    <html lang="en">
      <head />
      <body className="px-8">
        <div className="border p-4 mb-4 mt-8">
          <p>Draft mode: {isDraftMode ? 'On' : 'Off'}</p>
          {isDraftMode && <DebugStatus />}
          <form action={toggleDraftMode}>
            <button className="bg-blue-500 text-white px-2 py-1 rounded font-medium">
              <FormStatusLabel idle="Toggle" pending="Toggling..." />
            </button>
          </form>
        </div>
        {children}
        <RefreshButton />
        {isDraftMode && <VisualEditing />}
        <SanityLive />
      </body>
    </html>
  )
}
