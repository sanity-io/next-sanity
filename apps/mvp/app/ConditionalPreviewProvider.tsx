import {draftMode} from 'next/headers'

import PreviewProvider from './PreviewProvider'
import {token} from './sanity.fetch'

export default function ConditionalPreviewProvider({children}: {children: React.ReactNode}) {
  return draftMode().isEnabled ? (
    <PreviewProvider token={token}>{children}</PreviewProvider>
  ) : (
    children
  )
}
