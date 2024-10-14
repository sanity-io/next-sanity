import {draftMode} from 'next/headers'

import PreviewProvider from './PreviewProvider'
import {token} from './sanity.fetch'

export default async function ConditionalPreviewProvider({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  return (await draftMode()).isEnabled ? (
    <PreviewProvider token={token}>{children}</PreviewProvider>
  ) : (
    (children as JSX.Element)
  )
}
