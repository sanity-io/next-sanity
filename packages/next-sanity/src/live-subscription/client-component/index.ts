'use client'
import {usePathname, useRouter, useSearchParams} from 'next/navigation.js'
import {
  createClient,
  type LiveEventMessage,
  type LiveEventRestart,
  type SanityClient,
  type SyncTag,
} from 'next-sanity'
import {useEffect, useMemo, useRef, useState} from 'react'

import type {LiveSubscriptionProps} from '../types'

interface Listener {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (event: LiveEventMessage | LiveEventRestart | null, error?: any): void
}
interface CacheEntry {
  observer: ReturnType<ReturnType<SanityClient['live']['events']>['subscribe']>
  listeners: Set<Listener>
}

const subscriptionCache: Map<string, CacheEntry> = new Map()
let cleanup: ReturnType<typeof setTimeout> | null = null

/**
 * @alpha this API is experimental and may change or even be removed
 */
export default function LiveSubscription(props: LiveSubscriptionProps): null {
  const {projectId, dataset, apiHost, apiVersion, searchParamKey} = props
  const client = useMemo(
    () => createClient({projectId, dataset, apiHost, apiVersion, useCdn: false}),
    [apiHost, apiVersion, dataset, projectId],
  )
  const cacheKey = useMemo(() => {
    const path = client.getDataUrl('live/events')
    const url = new URL(client.getUrl(path, false))
    return url.toString()
  }, [client])

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // eslint-disable-next-line no-empty-function
  const updateRefresh = useRef<(lastLiveEventId: string) => void>(() => {})
  const [error, setError] = useState<Error | null>(null)

  if (error) {
    throw error
  }

  updateRefresh.current = (lastLiveEventId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (lastLiveEventId) {
      params.set(searchParamKey, lastLiveEventId)
    } else {
      params.delete(searchParamKey)
    }
    router.replace(`${pathname}?${params}`, {scroll: false})
  }

  const syncTags = useRef<SyncTag[]>(props.syncTags)
  useEffect(() => {
    syncTags.current = props.syncTags
  }, [props.syncTags])

  useEffect(() => {
    if (cleanup) clearTimeout(cleanup)

    const handler: Listener = (event, err) => {
      if (err) {
        setError(err)
        return
      }

      if (event) {
        if (event.type === 'restart') {
          updateRefresh.current('id' in event && typeof event.id === 'string' ? event.id : '')
        }

        if (
          event.type === 'message' &&
          Array.isArray(syncTags.current) &&
          event.tags.some((tag) => syncTags.current.includes(tag))
        ) {
          updateRefresh.current(event.id)
        }
      }
    }

    let cacheEntry = subscriptionCache.get(cacheKey)

    if (!cacheEntry) {
      const listeners = new Set<Listener>()
      const observer = client.live.events().subscribe({
        next: (event) => {
          const currentCacheEntry = subscriptionCache.get(cacheKey)
          if (currentCacheEntry) {
            for (const listener of currentCacheEntry.listeners) {
              listener(event)
            }
          }
        },
        error: (err) => {
          const currentCacheEntry = subscriptionCache.get(cacheKey)
          if (currentCacheEntry) {
            for (const listener of currentCacheEntry.listeners) {
              listener(null, err)
            }
          }
        },
      })

      cacheEntry = {observer, listeners}
      subscriptionCache.set(cacheKey, cacheEntry)
    }

    cacheEntry.listeners.add(handler)

    return () => {
      const currentCacheEntry = subscriptionCache.get(cacheKey)
      if (currentCacheEntry) {
        currentCacheEntry.listeners.delete(handler)
        cleanup = setTimeout(() => {
          if (currentCacheEntry.listeners.size === 0) {
            currentCacheEntry.observer.unsubscribe()
            subscriptionCache.delete(cacheKey)
          }
        }, 1000)
      }
    }
  }, [cacheKey, client.live])

  return null
}

export type {LiveSubscriptionProps} from '../types'
