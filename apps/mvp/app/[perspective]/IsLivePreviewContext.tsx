'use client'

import {useVisualEditingEnvironment} from 'next-sanity/hooks'
import {createContext} from 'react'

export const IsLivePreviewContext = createContext<boolean | null>(false)

export function IsLivePreviewProviderClient({children}: {children: React.ReactNode}) {
  const environment = useVisualEditingEnvironment()

  return (
    <IsLivePreviewContext value={environment === null ? null : true}>
      {children}
    </IsLivePreviewContext>
  )
}
