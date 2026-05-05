import type {ClientPerspective} from '@sanity/client'
import {createNode, createNodeMachine} from '@sanity/comlink'
import {
  createCompatibilityActors,
  type LoaderControllerMsg,
  type LoaderNodeMsg,
} from '@sanity/presentation-comlink'
import {setPerspectiveCookie} from 'next-sanity/live/server-actions'
import {useRouter} from 'next/navigation'
import {useEffect, useEffectEvent} from 'react'

import {setComlink, setComlinkClientConfig} from '../hooks/context'

function PresentationComlink(props: {
  projectId: string
  dataset: string
  draftModeEnabled: boolean
  draftModePerspective: ClientPerspective
}): React.JSX.Element | null {
  const {projectId, dataset, draftModeEnabled, draftModePerspective} = props
  const router = useRouter()

  useEffect(() => {
    setComlinkClientConfig(projectId, dataset)
  }, [dataset, projectId])

  const handlePerspectiveChange = useEffectEvent(
    (perspective: ClientPerspective, signal: AbortSignal) => {
      if (draftModeEnabled && perspective !== draftModePerspective) {
        setPerspectiveCookie(perspective)
          .then(() => {
            if (signal.aborted) return
            router.refresh()
          })
          .catch((reason) => console.error('Failed to set the preview perspective cookie', reason))
      }
    },
  )

  useEffect(() => {
    const comlink = createNode<LoaderNodeMsg, LoaderControllerMsg>(
      {
        name: 'loaders',
        connectTo: 'presentation',
      },
      createNodeMachine<LoaderNodeMsg, LoaderControllerMsg>().provide({
        actors: createCompatibilityActors<LoaderNodeMsg>(),
      }),
    )

    let controller: AbortController | undefined
    comlink.on('loader/perspective', (data) => {
      controller?.abort()
      controller = new AbortController()
      handlePerspectiveChange(data.perspective, controller.signal)
    })

    const stop = comlink.start()
    setComlink(comlink)
    return () => {
      stop()
    }
  }, [])

  return null
}
PresentationComlink.displayName = 'PresentationComlink'

export default PresentationComlink
