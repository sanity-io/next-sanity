import {
  createClient,
  type InitializedClientConfig,
  type LiveEvent,
  type LiveEventGoAway,
  type SyncTag,
} from '@sanity/client'
import {revalidateSyncTags as defaultRevalidateSyncTags} from 'next-sanity/live/server-actions'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useEffectEvent, startTransition} from 'react'

import {isCorsOriginError} from '#live/isCorsOriginError'

const RefreshOnFocus = dynamic(() => import('./RefreshOnFocus'))
const RefreshOnMount = dynamic(() => import('./RefreshOnMount'))
const RefreshOnInterval = dynamic(() => import('./RefreshOnInterval'))
const RefreshOnReconnect = dynamic(() => import('./RefreshOnReconnect'))

export interface SanityLiveProps extends Pick<
  InitializedClientConfig,
  | 'projectId'
  | 'dataset'
  | 'apiHost'
  | 'apiVersion'
  | 'useProjectHostname'
  | 'token'
  | 'requestTagPrefix'
> {
  draftModeEnabled: boolean
  requestTag: string
  waitFor?: 'function'

  revalidateSyncTags?: (tags: SyncTag[]) => Promise<void | 'refresh'>
  onError?: (error: unknown) => void
  intervalOnGoAway?: number | false
  onGoAway?: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void

  refreshOnMount?: boolean
  refreshOnFocus?: boolean
  refreshOnReconnect?: boolean
}

function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    projectId,
    dataset,
    apiHost,
    apiVersion,
    useProjectHostname,
    token,
    requestTagPrefix,
    draftModeEnabled,
    requestTag,
    waitFor,

    revalidateSyncTags = defaultRevalidateSyncTags,
    onError = handleError,
    intervalOnGoAway = 30_000,
    onGoAway = handleOnGoAway,

    refreshOnMount = false,
    refreshOnFocus = draftModeEnabled
      ? false
      : typeof window === 'undefined'
        ? true
        : window.self === window.top,
    refreshOnReconnect = true,
  } = props

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
          : draftModeEnabled
            ? 'automatic revalidation for only published content. Provide a `browserToken` to `defineLive` to support draft content outside of Presentation Tool.'
            : 'automatic revalidation of published content',
      )
      // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
      startTransition(() => setRefreshOnInterval(false))
    } else if (event.type === 'message') {
      if (waitFor === 'function') {
        // Cache is already revalidated by the Sanity Function, just refresh the router
        startTransition(() => router.refresh())
      } else {
        void revalidateSyncTags(event.tags).then((result) => {
          if (result === 'refresh') startTransition(() => router.refresh())
        })
      }
    } else if (event.type === 'restart' || event.type === 'reconnect') {
      // Disable long polling when restart/reconnect event is received, this is a no-op if long polling is already disabled
      startTransition(() => setRefreshOnInterval(false))
      // @TODO add support for `onRestart` and `onReconnect` events so this can be customized
      startTransition(() => router.refresh())
    } else if (event.type === 'goaway') {
      onGoAway(event, intervalOnGoAway)
      startTransition(() => setRefreshOnInterval(intervalOnGoAway))
    }
  })
  useEffect(() => {
    const subscription = client.live
      .events({includeDrafts: !!token, tag: requestTag, waitFor})
      .subscribe({
        next: handleLiveEvent,
        error: (err: unknown) => {
          onError(err)
        },
      })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag, token, waitFor])

  return (
    <>
      {!draftModeEnabled && refreshOnMount && <RefreshOnMount />}
      {refreshOnInterval && Number.isFinite(refreshOnInterval) && refreshOnInterval > 0 && (
        <RefreshOnInterval interval={refreshOnInterval} />
      )}
      {!draftModeEnabled && refreshOnFocus && <RefreshOnFocus />}
      {!draftModeEnabled && refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
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
