'use client'

import {useVisualEditingEnvironment} from 'next-sanity/hooks'
import {createContext, use} from 'react'

const IsLivePreviewContext = createContext<boolean | null>(false)

export function IsLivePreviewProvider({children}: {children: React.ReactNode}) {
  const environment = useVisualEditingEnvironment()

  return (
    <IsLivePreviewContext value={environment === null ? null : true}>
      {children}
    </IsLivePreviewContext>
  )
}

export function useIsLivePreview() {
  return use(IsLivePreviewContext)
}
