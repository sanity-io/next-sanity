'use client'

import dynamic from 'next/dynamic'
import {suspend} from 'suspend-react'

// import {LiveQueryProvider} from 'src/preview'
// import LiveQueryProvider from 'src/preview/LiveQueryProvider'
const LiveQueryProvider = dynamic(() => import('src/preview/LiveQueryProvider'))

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  const client = suspend(async () => {
    const {getClient} = await import('./sanity.client')
    return getClient(token)
  }, ['@sanity/client', token])
  return (
    <LiveQueryProvider
      client={client}
      logger={console}
      cache={{includeTypes: ['author', 'post']}}
    >
      {children}
    </LiveQueryProvider>
  )
}
