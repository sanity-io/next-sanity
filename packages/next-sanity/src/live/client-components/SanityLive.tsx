import {createClient, type LiveEvent} from '@sanity/client'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useEffectEvent, startTransition} from 'react'

import {cacheTagPrefix} from '#live/constants'
import type {
  SanityClientConfig,
  SanityLiveAction,
  SanityLiveContext,
  SanityLiveOnError,
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
  SanityLiveOnWelcome,
} from '#live/types'

import {RefreshOnInterval} from './RefreshOnInterval'

export interface SanityLiveProps {
  config: SanityClientConfig
  includeDrafts: true | undefined
  requestTag: string
  waitFor: 'function' | undefined

  action: SanityLiveAction
  onError: SanityLiveOnError | undefined
  onWelcome: SanityLiveOnWelcome | false | undefined
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

    action,
    onError,
    onWelcome = handleWelcome,
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

  const [error, setError] = useState<unknown>()
  if (error !== undefined) {
    // Throw during render to bubble up to the nearest <ErrorBoundary>, if `onError` is provided we won't rethrow
    throw error
  }
  const handleError = useEffectEvent((error: unknown) => {
    if (onError) {
      onError(error, actionContext)
    } else {
      setError(error)
    }
  })

  const router = useRouter()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    switch (event.type) {
      case 'welcome': {
        // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
        startTransition(() => setRefreshOnInterval(false))

        if (onWelcome) {
          startTransition(() => onWelcome(event, actionContext))
        }
        break
      }
      case 'message': {
        startTransition(() =>
          action === 'refresh'
            ? router.refresh()
            : action(event.tags.map((tag) => `${cacheTagPrefix}${tag}`)).then((result) => {
                if (result === 'refresh') {
                  startTransition(() => router.refresh())
                }
              }),
        )
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
      default:
        handleError(new Error('Unknown live event type', {cause: event}))
        break
    }
  })
  useEffect(() => {
    const subscription = client.live
      .events({includeDrafts, tag: requestTag, waitFor})
      .subscribe({next: handleLiveEvent, error: handleError})
    return () => subscription.unsubscribe()
  }, [client.live, requestTag, includeDrafts, waitFor])

  if (refreshOnInterval && Number.isFinite(refreshOnInterval) && refreshOnInterval > 0) {
    return <RefreshOnInterval interval={refreshOnInterval} />
  }
  return null
}

SanityLive.displayName = 'SanityLiveClientComponent'

export default SanityLive

const handleWelcome: SanityLiveOnWelcome = (_, {includeDrafts, waitFor}) => {
  // oxlint-disable-next-line no-console
  console.info(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> is connected and listening for live events to ${includeDrafts ? 'all content including drafts and version documents in content releases' : 'published content'}.${waitFor === 'function' ? ' Events will be delayed until after a Sanity Function has processed them.' : ''}`,
  )
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
