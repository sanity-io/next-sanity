// Just to see how low the bundlesize can realisticially go

'use client'

import dynamic from 'next/dynamic'

const LiveQueryProvider = dynamic(() => import('./PreviewProviderMockAux'))

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  return (
    <LiveQueryProvider logger={console} cache={{includeTypes: ['author', 'post']}}>
      {children}
    </LiveQueryProvider>
  )
}
