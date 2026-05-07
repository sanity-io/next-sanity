import {resolvePerspectiveFromCookies} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import {Suspense} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'

async function DraftModePerspectiveProvider({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) return children
  const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
  return <DraftModePerspectiveContext value={perspective}>{children}</DraftModePerspectiveContext>
}

export function DraftModePerspective({children}: {children: React.ReactNode}) {
  return (
    <Suspense
      fallback={
        <DraftModePerspectiveContext value="checking">{children}</DraftModePerspectiveContext>
      }
    >
      <DraftModePerspectiveProvider>{children}</DraftModePerspectiveProvider>
    </Suspense>
  )
}
