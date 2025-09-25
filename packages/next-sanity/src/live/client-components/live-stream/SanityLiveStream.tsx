import {
  type ClientPerspective,
  type ContentSourceMap,
  type InitializedClientConfig,
  type QueryParams,
} from '@sanity/client'
import {stegaEncodeSourceMap} from '@sanity/client/stega'
import type {LoaderControllerMsg} from '@sanity/presentation-comlink'
import {dequal} from 'dequal/lite'
import {use, useCallback, useEffect, useState, useSyncExternalStore} from 'react'
import {useEffectEvent} from 'use-effect-event'
import {comlinkListeners, comlink as comlinkSnapshot} from '../../hooks/context'

/**
 * @public
 */
export interface SanityLiveStreamProps
  extends Pick<InitializedClientConfig, 'projectId' | 'dataset'> {
  query: string
  params?: QueryParams
  perspective?: Exclude<ClientPerspective, 'raw'>
  stega?: boolean
  initial: Promise<React.ReactNode>
  children: (result: {
    data: unknown
    sourceMap: ContentSourceMap | null
    tags: string[]
  }) => Promise<React.ReactNode>
}

const LISTEN_HEARTBEAT_INTERVAL = 10_000

/**
 * @public
 */
export default function SanityLiveStream(props: SanityLiveStreamProps): React.JSX.Element | null {
  const {query, dataset, params = {}, perspective, projectId, stega} = props

  const subscribe = useCallback((listener: () => void) => {
    comlinkListeners.add(listener)
    return () => comlinkListeners.delete(listener)
  }, [])

  const comlink = useSyncExternalStore(
    subscribe,
    () => comlinkSnapshot,
    () => null,
  )
  const [children, setChildren] = useState<React.ReactNode | undefined>(undefined)

  const handleQueryHeartbeat = useEffectEvent((comlink: NonNullable<typeof comlinkSnapshot>) => {
    comlink.post('loader/query-listen', {
      projectId: projectId!,
      dataset: dataset!,
      perspective: perspective! as ClientPerspective,
      query,
      params: params!,
      heartbeat: LISTEN_HEARTBEAT_INTERVAL,
    })
  })
  const handleQueryChange = useEffectEvent(
    (event: Extract<LoaderControllerMsg, {type: 'loader/query-change'}>['data']) => {
      if (
        dequal(
          {
            projectId,
            dataset,
            query,
            params,
          },
          {
            projectId: event.projectId,
            dataset: event.dataset,
            query: event.query,
            params: event.params,
          },
        )
      ) {
        const {result, resultSourceMap, tags} = event
        const data = stega
          ? stegaEncodeSourceMap(result, resultSourceMap, {enabled: true, studioUrl: '/'})
          : result
        // eslint-disable-next-line no-console
        // console.log('server function streaming is disabled', {
        //   startTransition,
        //   setPromise,
        //   data,
        //   resultSourceMap,
        //   tags,
        // })
        // console.log('rendering with server action')
        // startTransition(() =>
        //   setPromise(
        //     props.children({
        //       data,
        //       sourceMap: resultSourceMap!,
        //       tags: tags || [],
        //     }) as Promise<React.JSX.Element>,
        //   ),
        // )
        // eslint-disable-next-line no-console
        console.groupCollapsed('rendering with server action')
        ;(
          props.children({
            data,
            sourceMap: resultSourceMap!,
            tags: tags || [],
          }) as Promise<React.JSX.Element>
        )
          .then(
            (children) => {
              // eslint-disable-next-line no-console
              console.log('setChildren(children)')
              // startTransition(() => setChildren(children))
              setChildren(children)
            },
            (reason: unknown) => {
              // eslint-disable-next-line no-console
              console.error('rendering with server action: render children error', reason)
            },
          )
          // eslint-disable-next-line no-console
          .finally(() => console.groupEnd())
      }
    },
  )
  useEffect(() => {
    if (!comlink) return

    const unsubscribe = comlink.on('loader/query-change', handleQueryChange)
    const interval = setInterval(() => handleQueryHeartbeat(comlink), LISTEN_HEARTBEAT_INTERVAL)
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [comlink])

  if (!comlink || children === undefined) {
    return use(props.initial) as React.JSX.Element
  }

  return <>{children}</>
}
