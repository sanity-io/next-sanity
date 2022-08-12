import {groqStore} from '@sanity/groq-store'
import EventSource from 'eventsource'
import {
  type Dispatch,
  type SetStateAction,
  type TransitionStartFunction,
  memo,
  useEffect,
  useMemo,
} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import type {GroqStoreEventSource} from 'src/types'
import {useSyncExternalStore} from 'use-sync-external-store/shim'

export type Params = Record<string, unknown>

export interface PreviewSubscriptionProps {
  // required stuff
  setData: Dispatch<SetStateAction<any[]>>
  initialData: any
  projectId: string
  dataset: string
  query: string
  // optional stuff
  params?: Params
  documentLimit?: number
  startTransition?: TransitionStartFunction
  // Both or neither
  // @TODO setup typing that enforce this condition
  token?: string
  EventSource?: GroqStoreEventSource
}
function PreviewSubscriptionComponent(props: PreviewSubscriptionProps) {
  console.log('PreviewSubscription', props, groqStore)

  const forwardedProps = useMemo(() => {
    return props.token && !props.EventSource ? {...props, EventSource} : props
  }, [props])
  const data = useSyncGroqStore(forwardedProps)
  console.log('sync data', data)

  const {setData, startTransition = unstable_batchedUpdates} = props
  useEffect(() => {
    console.count('data changed', data)
    startTransition(() => setData(data))
  }, [data, setData])

  return null
}

export const PreviewSubscription = memo(PreviewSubscriptionComponent)

type SyncGroqStore = {
  getSnapshot: () => any
  getServerSnapshot: () => any
  subscribe: (onStoreChange: () => void) => () => void
}

const useGroqStore = (props: PreviewSubscriptionProps): SyncGroqStore => {
  const {initialData, projectId, dataset, documentLimit, token, EventSource, params, query} =
    props
  return useMemo<SyncGroqStore>(() => {
    let snapshot: any = initialData
    return {
      getSnapshot: () => snapshot,
      subscribe: (onStoreChange: () => void) => {
        console.log('subscribe', props)
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
            throw err
          } else {
            snapshot = result
            onStoreChange()
          }
        })

        return () => subscription.unsubscribe()
      },
    }
  }, [EventSource, dataset, documentLimit, initialData, params, projectId, props, query, token])
}

const useSyncGroqStore = (props: PreviewSubscriptionProps) => {
  const store = useGroqStore(props)
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
