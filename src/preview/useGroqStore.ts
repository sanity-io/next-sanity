import {groqStore} from '@sanity/groq-store'
import {useMemo, useState} from 'react'

import type {GroqStoreEventSource} from '../types'
import {useParams} from '../useSubscription'

const EMPTY_PARAMS = {}

export type Params = Record<string, unknown>

export interface GroqStoreHookProps {
  // required stuff
  initial: any
  projectId: string
  dataset: string
  query: string
  // optional stuff
  params?: Params
  documentLimit?: number
  onError?: (error: Error) => void
  // Both or neither
  // eslint-disable-next-line no-warning-comments
  // @TODO setup typing that enforce this condition
  token?: string
  EventSource?: GroqStoreEventSource
}

type SyncGroqStore = {
  getSnapshot: () => any
  getServerSnapshot: () => any
  subscribe: (onStoreChange: () => void) => () => void
}

export const useGroqStore = ({
  projectId,
  dataset,
  documentLimit,
  token,
  EventSource,
  query,
  onError,
  ...props
}: GroqStoreHookProps): SyncGroqStore => {
  const [initial] = useState(props.initial)
  const params = useParams(props.params || EMPTY_PARAMS)

  return useMemo<SyncGroqStore>(() => {
    let snapshot: any = initial
    return {
      getSnapshot: () => snapshot,
      getServerSnapshot: () => initial,
      subscribe: (onStoreChange: () => void) => {
        const store = groqStore({
          projectId,
          dataset,
          documentLimit,
          token,
          EventSource,
          listen: true,
          overlayDrafts: true,
          subscriptionThrottleMs: 1,
        })
        const subscription = store.subscribe(query, params as any, (err, result) => {
          if (err) {
            // eslint-disable-next-line no-warning-comments
            // @TODO implement onError
            throw err
          } else {
            snapshot = result
            onStoreChange()
          }
        })

        return () => subscription.unsubscribe()
      },
    }
  }, [EventSource, dataset, documentLimit, initial, params, projectId, query, token])
}
