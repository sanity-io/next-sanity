import type {LiveEvent, LiveEventGoAway, SanityClient, SyncTag} from '@sanity/client'

import {DRAFT_SYNC_TAG_PREFIX} from '#live/constants'
import {useRouter} from 'next/navigation'
import {useEffect, useState, useEffectEvent} from 'react'

interface LiveEventsIncludingDraftsProps {
  client: SanityClient
  onEvent: (tags: string[]) => Promise<void | 'refresh'>
  requestTag: string
  onError: (error: unknown) => void
  intervalOnGoAway: number | false
  onGoAway: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void
}

function LiveEventsIncludingDrafts(props: LiveEventsIncludingDraftsProps): null {
  const {client, intervalOnGoAway, onError, onEvent, onGoAway, requestTag} = props

  const [longPollingInterval, setLongPollingInterval] = useState<number | false>(false)

  const router = useRouter()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    if (process.env.NODE_ENV !== 'production' && event.type === 'welcome') {
      // oxlint-disable-next-line no-console
      console.info(
        '<SanityLive> is connected and listening for live events to all content including drafts and version documents in content releases',
      )
      // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
      setLongPollingInterval(false)
    } else if (event.type === 'message') {
      void onEvent(
        event.tags.map((tag: SyncTag) => `${DRAFT_SYNC_TAG_PREFIX}${tag}` as const),
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
    const subscription = client.live.events({includeDrafts: true, tag: requestTag}).subscribe({
      next: handleLiveEvent,
      error: onError,
    })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag])

  useEffect(() => {
    if (!longPollingInterval) return
    const interval = setInterval(() => router.refresh(), longPollingInterval)
    return () => clearInterval(interval)
  }, [longPollingInterval, router])

  return null
}

LiveEventsIncludingDrafts.displayName = 'LiveEventsIncludingDrafts'

export default LiveEventsIncludingDrafts
