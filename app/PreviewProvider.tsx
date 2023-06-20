'use client'

import {useMemo} from 'react'
import {LiveQueryProvider} from 'src/preview'

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
      cache={{
        // includeTypes: ['author', 'post'],
        maxDocuments: 30000,
      }}
    >
      {children}
    </LiveQueryProvider>
  )
}
