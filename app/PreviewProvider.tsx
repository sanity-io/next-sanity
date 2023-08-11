'use client'

import dynamic from 'next/dynamic'
import {useMemo} from 'react'

const LiveQueryProvider = dynamic(() => import('src/preview/LiveQueryProvider'))
// import LiveQueryProvider from 'src/preview/LiveQueryProvider'

import {getClient} from './sanity.client'

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  const client = useMemo(() => getClient({token}), [token])
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
