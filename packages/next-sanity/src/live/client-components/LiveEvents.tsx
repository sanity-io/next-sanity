import type {LiveEvent, LiveEventGoAway, SanityClient, SyncTag} from '@sanity/client'

import {PUBLISHED_SYNC_TAG_PREFIX} from '#live/constants'
import {useRouter} from 'next/navigation'
import {useEffect, useState, useEffectEvent} from 'react'

interface LiveEventsProps {
  client: SanityClient
  onEvent: (tags: string[]) => Promise<void | 'refresh'>
  requestTag: string
  onError: (error: unknown) => void
  intervalOnGoAway: number | false
  onGoAway: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void
}

function LiveEvents(props: LiveEventsProps): null {
  const {client, onEvent, intervalOnGoAway = 30_000, requestTag, onError, onGoAway} = props

  const [longPollingInterval, setLongPollingInterval] = useState<number | false>(false)

  const router = useRouter()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    if (process.env.NODE_ENV !== 'production' && event.type === 'welcome') {
      // oxlint-disable-next-line no-console
      console.info('<SanityLive> is connected and listening for live events to published content')
      // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
      setLongPollingInterval(false)
    } else if (event.type === 'message') {
      void onEvent(
        event.tags.map((tag: SyncTag) => `${PUBLISHED_SYNC_TAG_PREFIX}${tag}` as const),
      ).then((result) => {
        if (result === 'refresh') router.refresh()
      })
    } else if (event.type === 'restart' || event.type === 'reconnect') {
      router.refresh()
    } else if (event.type === 'goaway') {
      onGoAway(event, intervalOnGoAway)
      setLongPollingInterval(intervalOnGoAway)
    }
  })
  useEffect(() => {
    const subscription = client.live.events({tag: requestTag}).subscribe({
      next: handleLiveEvent,
      error: onError,
    })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag])

  /**
   * Handle switching to long polling when needed
   */
  useEffect(() => {
    if (!longPollingInterval) return
    const interval = setInterval(() => router.refresh(), longPollingInterval)
    return () => clearInterval(interval)
  }, [longPollingInterval, router])

  return null
}

LiveEvents.displayName = 'LiveEvents'

export default LiveEvents
