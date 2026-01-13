import {PUBLISHED_SYNC_TAG_PREFIX} from '#live/constants'
import {setEnvironment} from '#live/context'
import {isCorsOriginError} from '#live/isCorsOriginError'
import {
  createClient,
  type ClientPerspective,
  type InitializedClientConfig,
  type LiveEvent,
  type LiveEventGoAway,
  type SyncTag,
} from '@sanity/client'
import {isMaybePresentation, isMaybePreviewWindow} from '@sanity/presentation-comlink'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useEffectEvent} from 'react'

const PresentationComlink = dynamic(() => import('./PresentationComlink'))
const RefreshOnMount = dynamic(() => import('./RefreshOnMount'))
const RefreshOnFocus = dynamic(() => import('./RefreshOnFocus'))
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

/**
 * @alpha CAUTION: this is an internal component and does not follow semver. Using it directly is at your own risk.
 */
export interface SanityLiveProps {
  config: SanityClientConfig
  /**
   * Setting this to 'published' opens one live event connection, setting it to any other value opens both the live event connections if needed
   */
  perspective: Exclude<ClientPerspective, 'raw'>

  onLiveEvent: (tags: string[]) => Promise<void | 'refresh'>
  onLiveEventIncludingDrafts: (tags: string[]) => Promise<void | 'refresh'>
  onPresentationPerspective: (perspective: ClientPerspective) => Promise<void>

  refreshOnMount?: boolean
  refreshOnFocus?: boolean
  refreshOnReconnect?: boolean
  requestTag: string

  /**
   * Handle errors from the Live Events subscription.
   * By default it's reported using `console.error`, you can override this prop to handle it in your own way.
   */
  onError?: (error: unknown) => void
  intervalOnGoAway?: number | false
  onGoAway?: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void
}

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

function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    config,
    onLiveEvent,
    // onLiveEventIncludingDrafts,
    onPresentationPerspective,
    perspective,

    refreshOnMount = false,
    refreshOnFocus = perspective !== 'published'
      ? false
      : typeof window === 'undefined'
        ? true
        : window.self === window.top,
    refreshOnReconnect = true,
    intervalOnGoAway = 30_000,
    requestTag,
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
          : perspective === 'published'
            ? 'automatic revalidation for only published content. Provide a `browserToken` to `defineLive` to support draft content outside of Presentation Tool.'
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
  useEffect(() => {
    const subscription = client.live.events({includeDrafts: !!token, tag: requestTag}).subscribe({
      next: handleLiveEvent,
      error: (err: unknown) => {
        // console.error('What?', err)
        onError(err)
      },
    })
    return () => subscription.unsubscribe()
  }, [client.live, onError, requestTag, token])

  const [loadComlink, setLoadComlink] = useState(false)

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

  return (
    <>
      {loadComlink && (
        <PresentationComlink
          projectId={projectId!}
          dataset={dataset!}
          onPerspective={onPresentationPerspective}
        />
      )}
      {refreshOnMount && <RefreshOnMount />}
      {refreshOnFocus && <RefreshOnFocus />}
      {refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
}

SanityLive.displayName = 'SanityLiveClientComponent'

export default SanityLive
