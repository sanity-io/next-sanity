'use client'

import {LiveQueryProvider} from 'next-sanity/preview'

import {client} from '../sanity.client'

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  if (!token) throw new TypeError('Missing token')
  return (
    <LiveQueryProvider client={client} token={token} logger={console}>
      {children}
    </LiveQueryProvider>
  )
}
