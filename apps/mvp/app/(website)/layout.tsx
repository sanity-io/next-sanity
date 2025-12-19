'use cache'

import '../globals.css'
import {
  // cookies,
  draftMode,
} from 'next/headers'
// import {resolvePerspectiveFromCookies} from 'next-sanity/experimental/live'
// import {Suspense} from 'react'
import {debug} from 'next-sanity/debug'
import {VisualEditing} from 'next-sanity/visual-editing'
import {cacheLife, refresh, updateTag} from 'next/cache'

import {DebugStatus} from './DebugStatus'
import {FormStatusLabel} from './FormStatus'
import {SanityLive} from './live'
import {RefreshButton} from './RefreshButton'

async function cacheDebug() {
  'use cache: remote'
  cacheLife('sanity')
  return await debug()
}

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
          <p>Debug: {JSON.stringify(await cacheDebug())}</p>
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
        <SanityLive />
      </body>
    </html>
  )
}
