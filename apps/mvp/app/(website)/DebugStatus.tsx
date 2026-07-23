'use client'

import {useIsPresentationTool, useVisualEditingEnvironment} from 'next-sanity/hooks'
import {use} from 'react'

import {DraftModePerspectiveContext} from './DraftModePerspectiveContext'
import {DraftModeVariantContext} from './DraftModeVariantContext'
import {IsLivePreviewContext} from './IsLivePreviewContext'

export function DebugStatus() {
  const isPresentationTool = useIsPresentationTool()
  const environment = useVisualEditingEnvironment()
  const perspective = use(DraftModePerspectiveContext)
  const variant = use(DraftModeVariantContext)
  const isLivePreview = use(IsLivePreviewContext)

  // oxlint-disable-next-line no-console
  console.log({
    isPresentationTool,
    environment,
    perspective,
    variant,
    isLivePreview,
  })

  return (
    <>
      <p>Is Presentation Tool: {JSON.stringify(isPresentationTool)}</p>
      <p>Environment: {JSON.stringify(environment)}</p>
      <p>Perspective: {JSON.stringify(perspective)}</p>
      <p>Variant: {JSON.stringify(variant)}</p>
      <p>Is Live Preview: {isLivePreview === null ? 'Maybe' : isLivePreview ? 'Yes' : 'No'}</p>
    </>
  )
}
