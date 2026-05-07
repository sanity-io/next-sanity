'use client'

import {
  useDraftModeEnvironment,
  useIsPresentationTool,
  useVisualEditingEnvironment,
} from 'next-sanity/hooks'
import {use} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'
import {IsLivePreviewContext} from './IsLivePreviewContext'

export function DebugStatus() {
  const isPresentationTool = useIsPresentationTool()
  const environmentDeprecated = useDraftModeEnvironment()
  const environment = useVisualEditingEnvironment()
  const perspective = use(DraftModePerspectiveContext)
  const isLivePreview = use(IsLivePreviewContext)

  // oxlint-disable-next-line no-console
  console.log({
    isPresentationTool,
    'environment (deprecated)': environmentDeprecated,
    environment,
    perspective,
    isLivePreview,
  })

  return (
    <>
      <p>Is Presentation Tool: {JSON.stringify(isPresentationTool)}</p>
      <p>Environment (deprecated): {JSON.stringify(environmentDeprecated)}</p>
      <p>Environment: {JSON.stringify(environment)}</p>
      <p>Perspective: {JSON.stringify(perspective)}</p>
      <p>Is Live Preview: {isLivePreview === null ? 'Maybe' : isLivePreview ? 'Yes' : 'No'}</p>
    </>
  )
}
