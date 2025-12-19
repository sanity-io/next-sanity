'use cache'

import '../globals.css'
import {resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {VisualEditing} from 'next-sanity/visual-editing'
import {refresh, updateTag} from 'next/cache'
import {cookies, draftMode} from 'next/headers'
import {Suspense} from 'react'

import {DebugStatus} from './DebugStatus'
import {FormStatusLabel} from './FormStatus'
import {Live} from './live'
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

async function SanityLive() {
  let perspective: LivePerspective = 'published'
  const isDraftMode = (await draftMode()).isEnabled
  if (isDraftMode) {
    perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
  }

  return <Live perspective={perspective} />
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled
  return (
    <html lang="en">
      <head />
      <body className="px-8">
        <div className="mt-8 mb-4 border p-4">
          <p>Debug: {JSON.stringify({env: 'unknown'})}</p>
          <form
            action={async () => {
              'use server'
              updateTag('sanity:debug')
            }}
          >
            <button type="submit">updateTag</button>
          </form>
          <form
            action={async () => {
              'use server'
              refresh()
            }}
          >
            <button type="submit">refresh</button>
          </form>
          <form
            action={async () => {
              'use server'
              updateTag('sanity:debug')
              refresh()
            }}
          >
            <button type="submit">updateTag + refresh</button>
          </form>

          <p>Draft mode: {isDraftMode ? 'On' : 'Off'}</p>
          {isDraftMode && <DebugStatus />}
          <form action={toggleDraftMode}>
            <button className="rounded bg-blue-500 px-2 py-1 font-medium text-white">
              <FormStatusLabel idle="Toggle" pending="Toggling..." />
            </button>
          </form>
        </div>
        {children}
        <RefreshButton />
        {isDraftMode && <VisualEditing />}
        <Suspense>
          <SanityLive />
        </Suspense>
      </body>
    </html>
  )
}
