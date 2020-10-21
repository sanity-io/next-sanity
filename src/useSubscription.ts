import {useState} from 'react'
import {GroqStore, groqStore} from '@sanity/groq-store'
import {useDeepCompareEffectNoCheck as useDeepCompareEffect} from 'use-deep-compare-effect'
import {ProjectConfig} from './types'

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
    return useQuerySubscription<R>(
      getStore,
      query,
      params,
      initialData as any,
      enabled && typeof window !== 'undefined'
    )
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

function useQuerySubscription<R = any>(
  getStore: () => GroqStore,
  query: string,
  params: Record<string, unknown>,
  initialData: R,
  enabled = false
) {
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

    const subscription = getStore().subscribe(query, params, (err, result) => {
      if (err) {
        setError(err)
      } else {
        setData(result)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [getStore, query, params, enabled])

  return {data, loading, error}
}
