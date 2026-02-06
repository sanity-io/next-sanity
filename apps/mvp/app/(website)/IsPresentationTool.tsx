'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'

export function IsPresentationTool() {
  const isPresentationTool = useIsPresentationTool()
  return <p>Is Presentation Tool: {JSON.stringify(isPresentationTool)}</p>
}
