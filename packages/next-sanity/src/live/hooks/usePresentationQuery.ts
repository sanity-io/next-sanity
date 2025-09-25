import type {ClientPerspective, ClientReturn, ContentSourceMap, QueryParams} from '@sanity/client'
import {stegaEncodeSourceMap} from '@sanity/client/stega'
import type {LoaderControllerMsg} from '@sanity/presentation-comlink'
import {dequal} from 'dequal/lite'
import {useEffect, useMemo, useReducer, useSyncExternalStore} from 'react'
import {useEffectEvent} from 'use-effect-event'
import {
  comlinkDataset,
  comlinkListeners,
  comlinkProjectId,
  comlink as comlinkSnapshot,
} from './context'
import {useDraftModePerspective} from './useDraftMode'

/** @alpha */
export type UsePresentationQueryReturnsInactive = {
  data: null
  sourceMap: null
  perspective: null
}

/** @alpha */
export type UsePresentationQueryReturnsActive<QueryString extends string> = {
  data: ClientReturn<QueryString>
  sourceMap: ContentSourceMap | null
  perspective: ClientPerspective
}

export type UsePresentationQueryReturns<QueryString extends string> =
  | UsePresentationQueryReturnsInactive
  | UsePresentationQueryReturnsActive<QueryString>

type Action<QueryString extends string> = {
  type: 'query-change'
  payload: UsePresentationQueryReturnsActive<QueryString>
}

function reducer<QueryString extends string>(
  state: UsePresentationQueryReturns<QueryString>,
  {type, payload}: Action<QueryString>,
): UsePresentationQueryReturns<QueryString> {
  switch (type) {
    case 'query-change':
      return dequal(state, payload)
        ? state
        : {
            ...state,
            data: dequal(state.data, payload.data)
              ? (state.data as ClientReturn<QueryString>)
              : payload.data,
            sourceMap: dequal(state.sourceMap, payload.sourceMap)
              ? (state.sourceMap as ContentSourceMap | null)
              : payload.sourceMap,
            perspective: dequal(state.perspective, payload.perspective)
              ? (state.perspective as Exclude<ClientPerspective, 'raw'>)
              : payload.perspective,
          }
    default:
      return state
  }
}
const initialState: UsePresentationQueryReturnsInactive = {
  data: null,
  sourceMap: null,
  perspective: null,
}

function subscribe(listener: () => void) {
  comlinkListeners.add(listener)
  return () => comlinkListeners.delete(listener)
}

const EMPTY_QUERY_PARAMS: QueryParams = {}
const LISTEN_HEARTBEAT_INTERVAL = 10_000

/**
 * Experimental hook that can run queries in Presentation Tool.
 * Query results are sent back over postMessage whenever the query results change.
 * It also works with optimistic updates in the studio itself, offering low latency updates.
 * It's not as low latency as the `useOptimistic` hook, but it's a good compromise for some use cases.
 * Especially until `useOptimistic` propagates edits in the Studio parent window back into the iframe.
 * @alpha
 */
export function usePresentationQuery<const QueryString extends string>(props: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  stega?: boolean
}): UsePresentationQueryReturns<QueryString> {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {query, params = EMPTY_QUERY_PARAMS, stega = true} = props

  /**
   * Comlink forwards queries we want to run to the parent window where Presentation Tool handles it for us
   */
  const comlink = useSyncExternalStore(
    subscribe,
    () => comlinkSnapshot,
    () => null,
  )
  /**
   * The comlink events requires projectId and dataset, Presentation Tool uses it to protect against project and dataset mismatch errors.
   * We don't want to force the consumers of the `usePresentationQuery` hook to provide these,
   * so we set them in the component that establishes the comlink connection and propagates it to all the subscribes.
   */
  const projectId = useSyncExternalStore(
    subscribe,
    () => comlinkProjectId,
    () => null,
  )
  const dataset = useSyncExternalStore(
    subscribe,
    () => comlinkDataset,
    () => null,
  )
  /**
   * The perspective is kept in sync with Presentation Tool's perspective, and even knows what perspective the page loaded with initially and can forward it to the Sanity Studio.
   */
  const perspective = useDraftModePerspective()
  const handleQueryHeartbeat = useEffectEvent((comlink: NonNullable<typeof comlinkSnapshot>) => {
    // Handle odd case where the comlink can take events but some data is missing
    if (!projectId || !dataset || !perspective) {
      // eslint-disable-next-line no-console
      console.warn('usePresentationQuery: projectId, dataset and perspective must be set', {
        projectId,
        dataset,
        perspective,
      })
      return
    }
    // Another odd case where the initial perspective states haven't resolved to the actual perspective state
    if (perspective === 'checking' || perspective === 'unknown') {
      return
    }
    comlink.post('loader/query-listen', {
      projectId,
      dataset,
      perspective,
      query,
      params,
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
        dispatch({
          type: 'query-change',
          payload: {
            data: event.result,
            sourceMap: event.resultSourceMap || null,
            perspective: event.perspective,
          },
        })
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

  return useMemo(() => {
    if (stega && state.sourceMap) {
      return {
        ...state,
        data: stegaEncodeSourceMap(state.data, state.sourceMap, {enabled: true, studioUrl: '/'}),
      }
    }
    return state
  }, [state, stega])
}
