'use client'

import {
  useDraftModeEnvironment,
  useDraftModePerspective,
  useIsLivePreview,
  useIsPresentationTool,
} from 'next-sanity/hooks'

export function DebugStatus() {
  const environment = useDraftModeEnvironment()
  const perspective = useDraftModePerspective()
  const isLivePreview = useIsLivePreview()
  const isPresentationTool = useIsPresentationTool()

  // oxlint-disable-next-line no-console
  console.log({environment, perspective, isLivePreview, isPresentationTool})

  return (
    <>
      <p>Environment: {environment}</p>
      <p>Perspective: {JSON.stringify(perspective)}</p>
      <p>Is Live Preview: {isLivePreview === null ? 'Maybe' : isLivePreview ? 'Yes' : 'No'}</p>
      <p>
        Is Presentation Tool:{' '}
        {isPresentationTool === null ? 'Maybe' : isPresentationTool ? 'Yes' : 'No'}
      </p>
    </>
  )
}
