import type {SanityLiveActionContext} from '#live/types'

import {isCorsOriginError} from '#live/isCorsOriginError'
import {createClient, type InitializedClientConfig, type LiveEvent} from '@sanity/client'
import dynamic from 'next/dynamic'
import {startTransition, useEffect, useEffectEvent, useMemo, useState} from 'react'

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
  includeAllDocuments?: boolean
  requestTag: string

  action: (
    event: Extract<LiveEvent, {type: 'message'}>,
    context: SanityLiveActionContext,
  ) => Promise<void>
  reconnectAction?: (
    event: Extract<LiveEvent, {type: 'reconnect'}>,
    context: SanityLiveActionContext,
  ) => Promise<void>
  restartAction?: (
    event: Extract<LiveEvent, {type: 'restart'}>,
    context: SanityLiveActionContext,
  ) => Promise<void>
  welcomeAction?:
    | ((
        event: Extract<LiveEvent, {type: 'welcome'}>,
        context: SanityLiveActionContext,
      ) => Promise<void>)
    | false
  goAwayAction?:
    | ((
        event: Extract<LiveEvent, {type: 'goaway'}>,
        context: SanityLiveActionContext,
      ) => Promise<number | false>)
    | false

  refreshOnMount?: boolean
  refreshOnFocus?: boolean
  refreshOnReconnect?: boolean
}

function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    config,
    includeAllDocuments = false,
    action,
    goAwayAction,
    reconnectAction,
    restartAction,
    welcomeAction,
    refreshOnMount = false,
    refreshOnFocus = false,
    refreshOnReconnect = true,
    requestTag,
  } = props
  const {projectId, dataset, apiHost, apiVersion, useProjectHostname, token, requestTagPrefix} =
    config
  const actionContext = {includeAllDocuments} satisfies SanityLiveActionContext
  const [error, setError] = useState<unknown>(null)
  if (error) {
    if (isCorsOriginError(error)) {
      throw new Error(
        `Sanity Live is unable to connect to the Sanity API as the current origin - ${window.origin} - is not in the list of allowed CORS origins for this Sanity Project.${error.addOriginUrl ? ` Add it here: ${error.addOriginUrl}` : ''}`,
        {cause: error},
      )
    } else {
      throw error
    }
  }

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

  const handleLiveEvent = useEffectEvent(async (event: LiveEvent) => {
    switch (event.type) {
      case 'welcome': {
        // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
        setRefreshOnInterval(false)

        if (welcomeAction) {
          await welcomeAction(event, actionContext)
        } else if (welcomeAction !== false && process.env.NODE_ENV !== 'production') {
          // oxlint-disable-next-line no-console
          console.info(
            `<SanityLive> is connected and listening for live events to ${includeAllDocuments ? 'all content including drafts and version documents in content releases' : 'published content'}`,
          )
        }
        break
      }
      case 'message': {
        await action(event, actionContext)
        break
      }
      case 'restart': {
        await restartAction?.(event, actionContext)
        break
      }
      case 'reconnect': {
        await reconnectAction?.(event, actionContext)
        break
      }
      case 'goaway': {
        if (goAwayAction !== false) {
          let interval = goAwayAction ? await goAwayAction(event, actionContext) : 30_000
          if (interval === false) return
          if (Number.isFinite(interval) && interval > 0) {
            startTransition(() => setRefreshOnInterval(interval))
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                'Sanity Live connection closed, switching to long polling set to a interval of',
                interval / 1_000,
                'seconds and the server gave this reason:',
                event.reason,
              )
            }
          }
        } else {
          setError(
            new Error(
              `Sanity Live connection closed, automatic revalidation is disabled, the server gave this reason: ${event.reason}`,
              {cause: event},
            ),
          )
        }
        break
      }
      default:
        setError(new Error(`Unknown live event type`, {cause: event}))
        break
    }
  })
  useEffect(() => {
    const subscription = client.live
      .events({includeDrafts: includeAllDocuments, tag: requestTag})
      .subscribe({
        next: (event) => startTransition(() => handleLiveEvent(event)),
        error: (error) => startTransition(() => setError(error)),
      })
    return () => subscription.unsubscribe()
  }, [client.live, requestTag, includeAllDocuments])

  return (
    <>
      {refreshOnFocus && <RefreshOnFocus />}
      {refreshOnInterval && <RefreshOnInterval interval={refreshOnInterval} />}
      {refreshOnMount && <RefreshOnMount />}
      {refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
}

SanityLive.displayName = 'SanityLiveClientComponent'

export default SanityLive
