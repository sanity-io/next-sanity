import {createClient, type LiveEvent, type SyncTag} from '@sanity/client'
import {revalidateSyncTags as defaultRevalidateSyncTags} from 'next-sanity/live/server-actions'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useEffectEvent, startTransition} from 'react'

import {isCorsOriginError} from '#live/isCorsOriginError'
import type {
  SanityClientConfig,
  SanityLiveContext,
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
} from '#live/types'

import {RefreshOnInterval} from './RefreshOnInterval'

export interface SanityLiveProps {
  config: SanityClientConfig
  includeDrafts: true | undefined
  requestTag: string
  waitFor: 'function' | undefined

  revalidateSyncTags?: (tags: SyncTag[]) => Promise<void | 'refresh'>
  onError?: (error: unknown) => void
  onReconnect: SanityLiveOnReconnect | false | undefined
  onRestart: SanityLiveOnRestart | false | undefined
  onGoAway: SanityLiveOnGoaway | false | undefined
}

function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    config,
    includeDrafts = false,
    requestTag,
    waitFor,

    revalidateSyncTags = defaultRevalidateSyncTags,
    onError = handleError,
    onReconnect = 'refresh',
    onRestart = 'refresh',
    onGoAway = handleGoaway,
  } = props
  const {projectId, dataset, apiHost, apiVersion, useProjectHostname, token, requestTagPrefix} =
    config
  const actionContext = {includeDrafts, waitFor} satisfies SanityLiveContext

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

  // The interval is set in milliseconds, false means long polling is disabled
  const [refreshOnInterval, setRefreshOnInterval] = useState<number | false>(false)

  const router = useRouter()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    switch (event.type) {
      case 'welcome': {
        if (process.env.NODE_ENV !== 'production') {
          // oxlint-disable-next-line no-console
          console.info(
            'Sanity is live with',
            token
              ? 'automatic revalidation for draft content changes as well as published content'
              : includeDrafts
                ? 'automatic revalidation for only published content. Provide a `browserToken` to `defineLive` to support draft content outside of Presentation Tool.'
                : 'automatic revalidation of published content',
          )
        }
        // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
        startTransition(() => setRefreshOnInterval(false))
        break
      }
      case 'message': {
        if (waitFor === 'function') {
          // Cache is already revalidated by the Sanity Function, just refresh the router
          startTransition(() => router.refresh())
        } else {
          void revalidateSyncTags(event.tags).then((result) => {
            if (result === 'refresh') startTransition(() => router.refresh())
          })
        }
        break
      }
      case 'reconnect': {
        // Disable long polling when reconnect event is received, this is a no-op if long polling is already disabled
        startTransition(() => setRefreshOnInterval(false))

        if (onReconnect) {
          startTransition(() =>
            onReconnect === 'refresh'
              ? router.refresh()
              : Promise.resolve(onReconnect(event, actionContext)).then((result) => {
                  if (result === 'refresh') {
                    startTransition(() => router.refresh())
                  }
                }),
          )
        }
        break
      }
      case 'restart': {
        // Disable long polling when restart event is received, this is a no-op if long polling is already disabled
        startTransition(() => setRefreshOnInterval(false))

        if (onRestart) {
          startTransition(() =>
            onRestart === 'refresh'
              ? router.refresh()
              : Promise.resolve(onRestart(event, actionContext)).then((result) => {
                  if (result === 'refresh') {
                    startTransition(() => router.refresh())
                  }
                }),
          )
        }
        break
      }
      case 'goaway': {
        if (onGoAway) {
          startTransition(() =>
            onGoAway(event, actionContext, (interval) =>
              startTransition(() => setRefreshOnInterval(interval)),
            ),
          )
        } else if (!onGoAway) {
          handleError(
            new Error(
              `Sanity Live connection closed, automatic revalidation is disabled, the server gave this reason: ${event.reason}`,
              {cause: event},
            ),
          )
        }
        break
      }
    }
  })
  useEffect(() => {
    const subscription = client.live.events({includeDrafts, tag: requestTag, waitFor}).subscribe({
      next: handleLiveEvent,
      error: (err: unknown) => {
        onError(err)
      },
    })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag, includeDrafts, waitFor])

  if (refreshOnInterval && Number.isFinite(refreshOnInterval) && refreshOnInterval > 0) {
    return <RefreshOnInterval interval={refreshOnInterval} />
  }
  return null
}

SanityLive.displayName = 'SanityLiveClientComponent'

export default SanityLive

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

const handleGoaway: SanityLiveOnGoaway = (event, {includeDrafts}, setLongPollingInterval) => {
  const interval = 30_000
  console.warn(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> connection is closed after receiving a 'goaway' event, the server gave this reason:`,
    JSON.stringify(event.reason),
    `Content will now be refreshed every ${interval / 1_000} seconds`,
  )
  setLongPollingInterval(interval)
}
