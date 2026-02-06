'use client'

import {
  useDraftModeEnvironment,
  useDraftModePerspective,
  useIsLivePreview,
  useIsPresentationTool,
  useVisualEditingEnvironment,
} from 'next-sanity/hooks'

export function DebugStatus() {
  const environmentDeprecated = useDraftModeEnvironment()
  const environment = useVisualEditingEnvironment()
  const perspective = useDraftModePerspective()
  const isLivePreview = useIsLivePreview()
  const isPresentationTool = useIsPresentationTool()

  // oxlint-disable-next-line no-console
  console.log({
    'environment (deprecated)': environmentDeprecated,
    'environment (visual editing)': environment,
    perspective,
    isLivePreview,
    isPresentationTool,
  })

  return (
    <>
      <p>Environment (deprecated): {JSON.stringify(environmentDeprecated)}</p>
      <p>Environment (visual editing): {JSON.stringify(environment)}</p>
      <p>Perspective: {JSON.stringify(perspective)}</p>
      <p>Is Live Preview: {isLivePreview === null ? 'Maybe' : isLivePreview ? 'Yes' : 'No'}</p>
    </>
  )
}
