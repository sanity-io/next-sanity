'use client'

import {setEnvironment} from '#client-components/context'
import {PUBLISHED_SYNC_TAG_PREFIX} from '#live/constants'
import {isCorsOriginError} from '#live/isCorsOriginError'
import {
  createClient,
  type LiveEvent,
  type LiveEventGoAway,
  type SyncTag,
} from '@sanity/client'
import {isMaybePresentation, isMaybePreviewWindow} from '@sanity/presentation-comlink'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useEffectEvent} from 'react'
import type { SanityLiveProps } from '../../live/client-components/live/SanityLive'



function handleError(error: unknown) {
  if (isCorsOriginError(error)) {
    console.warn(
      `Sanity Live is unable to connect to the Sanity API as the current origin - ${window.origin} - is not in the list of allowed CORS origins for this Sanity Project.`,
      error.addOriginUrl && `Add it here:`,
      error.addOriginUrl?.toString(),
    )
  } else {
    console.error(error)
  }
}

function handleOnGoAway(event: LiveEventGoAway, intervalOnGoAway: number | false) {
  if (intervalOnGoAway) {
    console.warn(
      'Sanity Live connection closed, switching to long polling set to a interval of',
      intervalOnGoAway / 1000,
      'seconds and the server gave this reason:',
      event.reason,
    )
  } else {
    console.error(
      'Sanity Live connection closed, automatic revalidation is disabled, the server gave this reason:',
      event.reason,
    )
  }
}

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export default function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    config,
    onLiveEvent,
    intervalOnGoAway = 30_000,
    requestTag = 'next-loader.live',
    onError = handleError,
    onGoAway = handleOnGoAway,
  } = props
  const {projectId, dataset, apiHost, apiVersion, useProjectHostname, token, requestTagPrefix} =
    config

  const client = useMemo(
    () =>
      createClient({
        projectId,
        dataset,
        apiHost,
        apiVersion,
        useProjectHostname,
        ignoreBrowserTokenWarning: true,
        token,
        useCdn: false,
        requestTagPrefix,
      }),
    [apiHost, apiVersion, dataset, projectId, requestTagPrefix, token, useProjectHostname],
  )
  const [longPollingInterval, setLongPollingInterval] = useState<number | false>(false)

  /**
   * 1. Handle Live Events and call revalidateTag or router.refresh when needed
   */
  const router = useRouter()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    if (process.env.NODE_ENV !== 'production' && event.type === 'welcome') {
      // oxlint-disable-next-line no-console
      console.info(
        'Sanity is live with',
        token
          ? 'automatic revalidation for draft content changes as well as published content'
          : 'automatic revalidation of published content',
      )
      // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
      setLongPollingInterval(false)
    } else if (event.type === 'message') {
      void onLiveEvent(
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
  // @TODO previous version that handle both published and draft events
  // useEffect(() => {
  //   const subscription = client.live.events({includeDrafts: !!token, tag: requestTag}).subscribe({
  //     next: handleLiveEvent,
  //     error: (err: unknown) => {
  //       onError(err)
  //     },
  //   })
  //   return () => subscription.unsubscribe()
  // }, [client.live, onError, requestTag, token])
  useEffect(() => {
    const subscription = client.live.events({tag: requestTag}).subscribe({
      next: handleLiveEvent,
      error: (err: unknown) => {
        onError(err)
      },
    })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag, token])

  /**
   * Handle live events for drafts differently, only use it to trigger refreshes, don't expire the cache
   */
  const handleLiveDraftEvent = useEffectEvent((event: LiveEvent) => {
    if (event.type === 'message') {
      // Just refresh, due to cache bypass in draft mode it'll fetch fresh content (though we wish cache worked as in production)
      // @TODO if draft content is published, then this extra refresh is unnecessary, it's tricky to check since `event.id` are different on the two EventSource connections
      router.refresh()
    }
  })
  useEffect(() => {
    if (!token) return
    const subscription = client.live.events({includeDrafts: !!token, tag: requestTag}).subscribe({
      next: handleLiveDraftEvent,
      error: (err: unknown) => {
        onError(err)
      },
    })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag, token])

  

  const [, setLoadComlink] = useState(false)
  

  /**
   * 4. If Presentation Tool is detected, load up the comlink and integrate with it
   */
  useEffect(() => {
    if (!isMaybePresentation()) return
    const controller = new AbortController()
    // Wait for a while to see if Presentation Tool is detected, before assuming the env to be stand-alone live preview
    const timeout = setTimeout(() => setEnvironment('live'), 3_000)
    window.addEventListener(
      'message',
      ({data}: MessageEvent<unknown>) => {
        if (
          data &&
          typeof data === 'object' &&
          'domain' in data &&
          data.domain === 'sanity/channels' &&
          'from' in data &&
          data.from === 'presentation'
        ) {
          clearTimeout(timeout)
          setEnvironment(isMaybePreviewWindow() ? 'presentation-window' : 'presentation-iframe')
          setLoadComlink(true)
          controller.abort()
        }
      },
      {signal: controller.signal},
    )
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])


  /**
   * 6. Handle switching to long polling when needed
   */
  useEffect(() => {
    if (!longPollingInterval) return
    const interval = setInterval(() => router.refresh(), longPollingInterval)
    return () => clearInterval(interval)
  }, [longPollingInterval, router])

  return null
}
