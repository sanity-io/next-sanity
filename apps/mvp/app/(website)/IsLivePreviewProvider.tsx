import {draftMode} from 'next/headers'
import {Suspense} from 'react'

import {IsLivePreviewProviderClient} from './IsLivePreviewContext'

async function IsLivePreviewProvider({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return children
  }
  return <IsLivePreviewProviderClient>{children}</IsLivePreviewProviderClient>
}

export function IsLivePreview({children}: {children: React.ReactNode}) {
  return (
    <Suspense fallback={children}>
      <IsLivePreviewProvider>{children}</IsLivePreviewProvider>
    </Suspense>
  )
}
