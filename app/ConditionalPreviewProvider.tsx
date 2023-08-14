import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'

import {token} from './sanity.fetch'

const PreviewProvider = dynamic(() => import('./PreviewProvider'))

export default function ConditionalPreviewProvider({children}: {children: React.ReactNode}) {
  return draftMode().isEnabled ? (
    <PreviewProvider token={token}>{children}</PreviewProvider>
  ) : (
    children
  )
}
