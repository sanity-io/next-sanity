'use client'

import {defineQuery} from 'next-sanity'
import {
  useIsLivePreview,
  useIsPresentationTool,
  useLiveEnvironment,
  usePresentationQuery,
  useVisualEditingEnvironment,
} from 'next-sanity/hooks'

const debugQuery = defineQuery(
  `{
  "type tag": count(*[ _type == $type ]),
  "id tag": count(*[_type == $type && _id == $id]),
  "slug tag": count(*[_type == $type && slug.current == $slug]),
}`,
)

export function DebugStatus() {
  const isLivePreview = useIsLivePreview()
  const isPresentationTool = useIsPresentationTool()
  const liveEnvironment = useLiveEnvironment()
  const presentationQuery = usePresentationQuery({query: debugQuery, stega: true})
  const visualEditingEnvironment = useVisualEditingEnvironment()

  // oxlint-disable-next-line no-console
  console.log({
    isLivePreview,
    isPresentationTool,
    liveEnvironment,
    presentationQuery,
    visualEditingEnvironment,
  })

  return (
    <>
      <p>useIsLivePreview: {JSON.stringify(isLivePreview)}</p>
      <p>useIsPresentationTool: {JSON.stringify(isPresentationTool)}</p>
      <p>useLiveEnvironment: {JSON.stringify(liveEnvironment)}</p>
      <p>usePresentationQuery: {JSON.stringify(presentationQuery)}</p>
      <p>useVisualEditingEnvironment: {JSON.stringify(visualEditingEnvironment)}</p>
    </>
  )
}
