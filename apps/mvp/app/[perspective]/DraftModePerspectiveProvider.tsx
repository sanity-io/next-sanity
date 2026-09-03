import {cookies, draftMode} from 'next/headers'
import {Suspense} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'
import {DraftModeVariantContext} from './DraftModeVariantContext'
import {resolvePreviewCookies} from './resolvePreviewCookies'

async function DraftModePerspectiveProvider({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) return children
  const jar = await cookies()
  const {perspective, variant} = await resolvePreviewCookies(jar)
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
