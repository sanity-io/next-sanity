import {useState} from 'react'
import {GroqStore, groqStore, Subscription} from '@sanity/groq-store'
import {useDeepCompareEffectNoCheck as useDeepCompareEffect} from 'use-deep-compare-effect'
import {ProjectConfig} from './types'
import {getCurrentUser} from './currentUser'
import {getAborter} from './aborter'

interface SubscriptionOptions<R = any> {
  enabled?: boolean
  params?: Record<string, unknown>
  initialData?: R
}

export function createPreviewSubscriptionHook({projectId, dataset}: ProjectConfig) {
  // Only construct/setup the store when `getStore()` is called
  let store: GroqStore

  return function usePreviewSubscription<R = any>(
    query: string,
    options: SubscriptionOptions<R> = {}
  ) {
    const {params = {}, initialData, enabled} = options
    return useQuerySubscription<R>({
      getStore,
      projectId,
      query,
      params,
      initialData: initialData as any,
      enabled: enabled ? typeof window !== 'undefined' : false,
    })
  }

  function getStore() {
    if (!store) {
      store = groqStore({
        projectId,
        dataset,
        listen: true,
        overlayDrafts: true,
        subscriptionThrottleMs: 10,
      })
    }
    return store
  }
}

function useQuerySubscription<R = any>(options: {
  getStore: () => GroqStore
  projectId: string
  query: string
  params: Record<string, unknown>
  initialData: R
  enabled: boolean
}) {
  const {getStore, projectId, query, params, initialData, enabled = false} = options
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<R>(initialData)

  // Use "deep" dependency comparison because params are often not _referentially_ equal,
  // but contains the same shallow properties, eg `{"slug": "some-slug"}`
  useDeepCompareEffect(() => {
    if (!enabled) {
      return () => {
        /* intentional noop */
      }
    }

    setLoading(true)

    const aborter = getAborter()
    let subscription: Subscription | undefined
    getCurrentUser(projectId, aborter)
      .then((user) => {
        if (!user) {
          // eslint-disable-next-line no-console
          console.warn('Not authenticated - preview not available')
          setError(new Error('Not authenticated - preview not available'))
          return
        }

        // We have a user, so set up the subscription
        subscription = getStore().subscribe(query, params, (err, result) => {
          if (err) {
            setError(err)
          } else {
            setData(result)
          }

          setLoading(false)
        })
      })
      .catch(setError)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }

      aborter.abort()
    }
  }, [getStore, query, params, enabled])

  return {data, loading, error}
}
