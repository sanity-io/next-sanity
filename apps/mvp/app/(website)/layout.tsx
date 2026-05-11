import '../globals.css'
import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'
import {Toaster} from 'sonner'

import {DebugStatus} from './DebugStatus'
import {DraftModePerspective} from './DraftModePerspectiveProvider'
import {FormStatusLabel} from './FormStatus'
import {IsLivePreview} from './IsLivePreviewProvider'
import {RefreshButton} from './RefreshButton'

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
        <div className="mt-8 mb-4 border p-4">
          <p>Draft mode: {isDraftMode ? 'On' : 'Off'}</p>
          <DraftModePerspective>
            <IsLivePreview>
              <DebugStatus />
            </IsLivePreview>
          </DraftModePerspective>
          <form action={toggleDraftMode}>
            <button className="rounded bg-blue-500 px-2 py-1 font-medium text-white">
              <FormStatusLabel idle="Toggle" pending="Toggling..." />
            </button>
          </form>
        </div>
        {children}
        <RefreshButton />
        {isDraftMode && <VisualEditing />}
        <Toaster />
      </body>
    </html>
  )
}
