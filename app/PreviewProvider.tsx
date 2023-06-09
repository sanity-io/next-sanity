'use client'

import {dataset, projectId} from 'app/config'
import {GroqStoreProvider} from 'src/preview/groq-store'

export default function PreviewProvider({
  children,
  token,
}: {
  children: React.ReactNode
  token: string
}) {
  return (
    <GroqStoreProvider
      projectId={projectId}
      dataset={dataset}
      token={token}
      documentLimit={Infinity}
    >
      {children}
    </GroqStoreProvider>
  )
}
