import type {ClientPerspective} from '@sanity/client'

import {
  setComlink,
  setComlinkClientConfig,
  setPerspective,
} from '#client-components/context'
import {sanitizePerspective} from '#live/sanitizePerspective'
import {createNode, createNodeMachine} from '@sanity/comlink'
import {
  createCompatibilityActors,
  type LoaderControllerMsg,
  type LoaderNodeMsg,
} from '@sanity/presentation-comlink'
import {setPerspectiveCookie} from 'next-sanity/live/server-actions'
import {startTransition, useEffect, useEffectEvent} from 'react'

export default function PresentationComlink(props: {
  projectId: string
  dataset: string
  onPerspective?: (perspective: ClientPerspective) => Promise<void>
}): React.JSX.Element | null {
  const {projectId, dataset, onPerspective = setPerspectiveCookie} = props

  useEffect(() => {
    setComlinkClientConfig(projectId, dataset)
  }, [dataset, projectId])

  const handlePerspectiveChange = useEffectEvent(
    (perspective: ClientPerspective) => {
        // @TODO remove `setPerspective` util and state
        setPerspective(sanitizePerspective(perspective, 'drafts'))
        startTransition(() =>  onPerspective(perspective))
    },
  )

  useEffect(() => {
    const controller = new AbortController()
    const comlink = createNode<LoaderNodeMsg, LoaderControllerMsg>(
      {name: 'loaders', connectTo: 'presentation'},
      createNodeMachine<LoaderNodeMsg, LoaderControllerMsg>().provide({
        actors: createCompatibilityActors<LoaderNodeMsg>(),
      }),
    )

    comlink.on('loader/perspective', (data) => {
      if(controller.signal.aborted) return

      handlePerspectiveChange(data.perspective)
    })

    const stop = comlink.start()
    setComlink(comlink)
    return () => {
      stop()
      controller.abort()
    }
  }, [])

  return null
}
