import type {ClientPerspective} from '@sanity/client'
import {
  createNode,
  createNodeMachine,
  // type Node,
} from '@sanity/comlink'
import {setPerspectiveCookie} from 'next-sanity/live/server-actions'
import {
  createCompatibilityActors,
  type LoaderControllerMsg,
  type LoaderNodeMsg,
} from '@sanity/presentation-comlink'
import {useRouter} from 'next/navigation'
import {
  useEffect,
  // useState
} from 'react'
import {useEffectEvent} from 'use-effect-event'
import {setComlink, setComlinkClientConfig} from '../../hooks/context'

function PresentationComlink(props: {
  projectId: string
  dataset: string
  // handleDraftModeAction: (secret: string) => Promise<void | string>
  draftModeEnabled: boolean
  draftModePerspective: ClientPerspective
}): React.JSX.Element | null {
  const {projectId, dataset, draftModeEnabled, draftModePerspective} = props
  const router = useRouter()

  // const [presentationComlink, setPresentationComlink] = useState<Node<
  //   LoaderControllerMsg,
  //   LoaderNodeMsg
  // > | null>(null)

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
          // eslint-disable-next-line no-console
          .catch((reason) => console.error('Failed to set the preview perspective cookie', reason))
      }
    },
  )

  // const [status, setStatus] = useState('disconnected')
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

    // comlink.onStatus((status) => {
    //   setStatus(status)
    // })

    let controller: AbortController | undefined
    comlink.on('loader/perspective', (data) => {
      controller?.abort()
      controller = new AbortController()
      handlePerspectiveChange(data.perspective, controller.signal)
    })

    const stop = comlink.start()
    // setPresentationComlink(comlink)
    setComlink(comlink)
    // eslint-disable-next-line no-console
    // console.log('setting comlink', comlink)
    return () => {
      // eslint-disable-next-line no-console
      // console.log('stopping comlink')
      stop()
    }
  }, [])

  // @TODO come back to this later
  // const handleEnableDraftMode = useEffectEvent(async (signal: AbortSignal) => {
  //   if (signal.aborted) return
  //   const {secret} = await (presentationComlink?.fetch(
  //     {
  //       type: 'loader/fetch-preview-url-secret' as const,
  //       data: {projectId, dataset},
  //     },
  //     {signal},
  //   ) || {secret: null})
  //   if (signal.aborted) return
  //   const error = await handleDraftModeAction(secret!)
  //   // eslint-disable-next-line no-console
  //   // @TODO call another server action here that can tell us if draft mode is actually enabled
  //   if (error) {
  //     // @TODO use sonnet or whatever to push a toast with the error
  //     // eslint-disable-next-line no-console
  //     console.error('Error enabling draft mode', error)
  //     return
  //   }
  //   // console.log('Draft mode enabled?', {enabled})
  //   if (signal.aborted) return
  //   router.refresh()
  // })
  // const connected = status === 'connected'
  // useEffect(() => {
  //   if (connected && !draftModeEnabled) {
  //     const controller = new AbortController()
  //     handleEnableDraftMode(controller.signal).catch((reason) => {
  //       // eslint-disable-next-line no-console
  //       console.error('Failed to enable draft mode', reason)
  //       return handleEnableDraftMode(controller.signal)
  //     })
  //     return () => {
  //       controller.abort()
  //     }
  //   }
  //   return undefined
  // }, [connected, draftModeEnabled, handleEnableDraftMode])

  return null
}
PresentationComlink.displayName = 'PresentationComlink'

export default PresentationComlink
