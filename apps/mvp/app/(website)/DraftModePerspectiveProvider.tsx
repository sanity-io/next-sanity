import {resolvePerspectiveFromCookies, resolveVariantFromCookies} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import {Suspense} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'
import {DraftModeVariantContext} from './DraftModeVariantContext'

async function DraftModePerspectiveProvider({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) return children
  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({cookies: jar})
  const variant = await resolveVariantFromCookies({cookies: jar})
  return (
    <DraftModePerspectiveContext value={perspective}>
      <DraftModeVariantContext value={variant ?? null}>{children}</DraftModeVariantContext>
    </DraftModePerspectiveContext>
  )
}

export function DraftModePerspective({children}: {children: React.ReactNode}) {
  return (
    <Suspense
      fallback={
        <DraftModePerspectiveContext value="checking">
          <DraftModeVariantContext value="checking">{children}</DraftModeVariantContext>
        </DraftModePerspectiveContext>
      }
    >
      <DraftModePerspectiveProvider>{children}</DraftModePerspectiveProvider>
    </Suspense>
  )
}
