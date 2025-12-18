import {createClient, type InitializedClientConfig, type LiveEvent} from '@sanity/client'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {startTransition, useEffect, useEffectEvent, useMemo, useState} from 'react'

import {cacheTagPrefixes} from '#live/constants'
import {isCorsOriginError} from '#live/isCorsOriginError'
import type {
  SanityLiveAction,
  SanityLiveActionContext,
  SanityLiveOnError,
  SanityLiveOnGoaway,
  SanityLiveOnReconnect,
  SanityLiveOnRestart,
  SanityLiveOnWelcome,
} from '#live/types'

const RefreshOnFocus = dynamic(() => import('./RefreshOnFocus'))
const RefreshOnMount = dynamic(() => import('./RefreshOnMount'))
const RefreshOnInterval = dynamic(() => import('./RefreshOnInterval'))
const RefreshOnReconnect = dynamic(() => import('./RefreshOnReconnect'))

interface SanityClientConfig extends Pick<
  InitializedClientConfig,
  | 'projectId'
  | 'dataset'
  | 'apiHost'
  | 'apiVersion'
  | 'useProjectHostname'
  | 'token'
  | 'requestTagPrefix'
> {}

export interface SanityLiveProps {
  config: SanityClientConfig
  includeDrafts?: boolean
  requestTag: string

  action: SanityLiveAction
  onError: SanityLiveOnError | false | undefined
  onWelcome: SanityLiveOnWelcome | false | undefined
  onReconnect: SanityLiveOnReconnect | false | undefined
  onRestart: SanityLiveOnRestart | false | undefined
  onGoAway: SanityLiveOnGoaway | false | undefined

  refreshOnMount?: boolean
  refreshOnFocus?: boolean
  refreshOnReconnect?: boolean
}

function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    config,
    includeDrafts = false,
    action,
    onError,
    onWelcome = handleWelcome,
    onReconnect,
    onRestart,
    onGoAway = handleGoaway,
    refreshOnMount = false,
    refreshOnFocus = false,
    refreshOnReconnect = true,
    requestTag,
  } = props
  const {projectId, dataset, apiHost, apiVersion, useProjectHostname, token, requestTagPrefix} =
    config
  const actionContext = {includeDrafts} satisfies SanityLiveActionContext

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

  const [refreshOnInterval, setRefreshOnInterval] = useState<number | false>(false)

  const [error, setError] = useState<unknown>(null)
  if (error) {
    // Throw during render to bubble up to the nearest <ErrorBoundary>, if `onError` is provided we won't rethrow
    throw error
  }
  const handleError = useEffectEvent((error: unknown) => {
    if (onError) {
      void onError(error, actionContext)
    } else {
      setError(
        isCorsOriginError(error)
          ? new Error(
              `Sanity Live is unable to connect to the Sanity API as the current origin - ${window.origin} - is not in the list of allowed CORS origins for this Sanity Project.${error.addOriginUrl ? ` Add it here: ${error.addOriginUrl}` : ''}`,
              {cause: error},
            )
          : error,
      )
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
          action(
            event.tags.map(
              (tag) =>
                `${includeDrafts ? cacheTagPrefixes.drafts : cacheTagPrefixes.published}${tag}`,
            ),
          ).then((result) => {
            if (result === 'refresh') {
              startTransition(() => router.refresh())
            }
          }),
        )
        break
      }
      case 'restart': {
        // Disable long polling when restart event is received, this is a no-op if long polling is already disabled
        startTransition(() => setRefreshOnInterval(false))

        if (onRestart) {
          startTransition(() => onRestart(event, actionContext))
        }
        break
      }
      case 'reconnect': {
        // Disable long polling when reconnect event is received, this is a no-op if long polling is already disabled
        startTransition(() => setRefreshOnInterval(false))

        if (onReconnect) {
          startTransition(() => onReconnect(event, actionContext))
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
        handleError(new Error(`Unknown live event type`, {cause: event}))
        break
    }
  })
  useEffect(() => {
    const subscription = client.live
      .events({includeDrafts, tag: requestTag})
      .subscribe({next: handleLiveEvent, error: handleError})
    return () => subscription.unsubscribe()
  }, [client.live, requestTag, includeDrafts])

  return (
    <>
      {refreshOnFocus && <RefreshOnFocus />}
      {refreshOnInterval && Number.isFinite(refreshOnInterval) && refreshOnInterval > 0 && (
        <RefreshOnInterval interval={refreshOnInterval} />
      )}
      {refreshOnMount && <RefreshOnMount />}
      {refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
}

SanityLive.displayName = 'SanityLiveClientComponent'

export default SanityLive

const handleWelcome: SanityLiveOnWelcome = (_, {includeDrafts}) => {
  // oxlint-disable-next-line no-console
  console.info(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> is connected and listening for live events to ${includeDrafts ? 'all content including drafts and version documents in content releases' : 'published content'}`,
  )
}

const handleGoaway: SanityLiveOnGoaway = (event, {includeDrafts}, setLongPollingInterval) => {
  const interval = 30_000
  console.warn(
    `<SanityLive${includeDrafts ? ' includeDrafts' : ''}> connection is closed after receiving a 'goaway' event, the server gave this reason:`,
    event.reason,
    `Content will now be refreshed every ${interval / 1_000} seconds`,
  )
  setLongPollingInterval(interval)
}
