'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'

export function PresentationStatus() {
  const isPresentationTool = useIsPresentationTool()
  return <p id="presentation-tool">{String(isPresentationTool)}</p>
}
