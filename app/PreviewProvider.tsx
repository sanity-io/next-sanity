'use client'

import {use} from 'react'
import {LiveQueryProvider} from 'src/preview'

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  const {client} = use(import('./sanity.client'))
  if (!token) throw new TypeError('Missing token')
  return (
    <LiveQueryProvider client={client} token={token} logger={console}>
      {children}
    </LiveQueryProvider>
  )
}
