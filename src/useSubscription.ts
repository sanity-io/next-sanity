import {useState, useEffect, useMemo} from 'react'
import {GroqStore, Subscription} from '@sanity/groq-store'
import {ProjectConfig} from './types'
import {getCurrentUser} from './currentUser'
import {getAborter, Aborter} from './aborter'

const EMPTY_PARAMS = {}

export type Params = Record<string, unknown>
export interface SubscriptionOptions<R = any> {
  enabled?: boolean
  params?: Params
  initialData?: R
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createPreviewSubscriptionHook({
  projectId,
  dataset,
  token,
  EventSource,
  documentLimit = 3000,
}: ProjectConfig & {documentLimit?: number}) {
  // Only construct/setup the store when `getStore()` is called
  let store: Promise<GroqStore>

  return function usePreviewSubscription<R = any>(
    query: string,
    options: SubscriptionOptions<R> = {}
  ) {
    const {params = EMPTY_PARAMS, initialData, enabled} = options
    return useQuerySubscription<R>({
      getStore,
      projectId,
      query,
      params,
      initialData: initialData as any,
      enabled: enabled ? typeof window !== 'undefined' : false,
      token,
    })
  }

  function getStore(abort: Aborter) {
    if (!store) {
      store = import('@sanity/groq-store').then(({groqStore}) => {
        // Skip creating the groq store if we've been unmounted to save memory and reduce gc pressure
        if (abort.signal.aborted) {
          const error = new Error('Cancelling groq store creation')
          // This ensures we can skip it in the catch block same way
          error.name = 'AbortError'
          return Promise.reject(error)
        }

        return groqStore({
          projectId,
          dataset,
          documentLimit,
          token,
          EventSource,
          listen: true,
          overlayDrafts: true,
          subscriptionThrottleMs: 10,
        })
      })
    }
    return store
  }
}

function useQuerySubscription<R = any>(options: {
  getStore: (abort: Aborter) => Promise<GroqStore>
  projectId: string
  query: string
  params: Params
  initialData: R
  enabled: boolean
  token?: string
}) {
  const {getStore, projectId, query, initialData, enabled = false, token} = options
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<R>()
  const params = useParams(options.params)

  // Use "deep" dependency comparison because params are often not _referentially_ equal,
  // but contains the same shallow properties, eg `{"slug": "some-slug"}`
  useEffect(() => {
    if (!enabled) {
      return
    }

    setLoading(true)

    const aborter = getAborter()
    let subscription: Subscription | undefined
    getCurrentUser(projectId, aborter, token)
      .then((user) => {
        if (user) {
          return
        }

        // eslint-disable-next-line no-console
        console.warn('Not authenticated - preview not available')
        throw new Error('Not authenticated - preview not available')
      })
      .then(() => getStore(aborter))
      .then((store) => {
        subscription = store.subscribe(query, params, (err, result) => {
          if (err) {
            setError(err)
          } else {
            setData(result)
          }
        })
      })
      .catch((err: Error) => (err.name === 'AbortError' ? null : setError(err)))
      .finally(() => setLoading(false))

    // eslint-disable-next-line consistent-return
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }

      aborter.abort()
    }
  }, [getStore, query, params, enabled, projectId, token])

  return {
    data: typeof data === 'undefined' ? initialData : data,
    loading,
    error,
  }
}

// Return params that are stable with deep equal as long as the key order is the same
function useParams(params: Params): Params {
  const stringifiedParams = useMemo(() => JSON.stringify(params), [params])
  return useMemo(() => JSON.parse(stringifiedParams), [stringifiedParams])
}
