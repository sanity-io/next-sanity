import {
  createClient,
  type ClientPerspective,
  type InitializedClientConfig,
  type LiveEvent,
  type LiveEventGoAway,
  type SyncTag,
} from '@sanity/client'
import {isMaybePresentation, isMaybePreviewWindow} from '@sanity/presentation-comlink'
import {revalidateSyncTags as defaultRevalidateSyncTags} from 'next-sanity/live/server-actions'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useRef, useState, useEffectEvent} from 'react'

import {isCorsOriginError} from '#isCorsOriginError'
import {setEnvironment, setPerspective} from '../../hooks/context'

const PresentationComlink = dynamic(() => import('./PresentationComlink'), {ssr: false})
const RefreshOnMount = dynamic(() => import('./RefreshOnMount'), {ssr: false})
const RefreshOnFocus = dynamic(() => import('./RefreshOnFocus'), {ssr: false})
const RefreshOnReconnect = dynamic(() => import('./RefreshOnReconnect'), {ssr: false})

/**
 * @public
 */
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
  // handleDraftModeAction: (secret: string) => Promise<void | string>
  draftModeEnabled: boolean
  draftModePerspective?: ClientPerspective
  refreshOnMount?: boolean
  refreshOnFocus?: boolean
  refreshOnReconnect?: boolean
  requestTag: string | undefined
  /**
   * Handle errors from the Live Events subscription.
   * By default it's reported using `console.error`, you can override this prop to handle it in your own way.
   */
  onError?: (error: unknown) => void
  intervalOnGoAway?: number | false
  onGoAway?: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void
  revalidateSyncTags?: (tags: SyncTag[]) => Promise<void | 'refresh'>
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

/**
 * @public
 */
export function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    projectId,
    dataset,
    apiHost,
    apiVersion,
    useProjectHostname,
    token,
    requestTagPrefix,
    // handleDraftModeAction,
    draftModeEnabled,
    draftModePerspective,
    refreshOnMount = false,
    refreshOnFocus = draftModeEnabled
      ? false
      : typeof window === 'undefined'
        ? true
        : window.self === window.top,
    refreshOnReconnect = true,
    intervalOnGoAway = 30_000,
    requestTag = 'next-loader.live',
    onError = handleError,
    onGoAway = handleOnGoAway,
    revalidateSyncTags = defaultRevalidateSyncTags,
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
          : draftModeEnabled
            ? 'automatic revalidation for only published content. Provide a `browserToken` to `defineLive` to support draft content outside of Presentation Tool.'
            : 'automatic revalidation of published content',
      )
      // Disable long polling when welcome event is received, this is a no-op if long polling is already disabled
      setLongPollingInterval(false)
    } else if (event.type === 'message') {
      void revalidateSyncTags(event.tags).then((result) => {
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

  /**
   * 2. Notify what perspective we're in, when in Draft Mode
   */
  useEffect(() => {
    if (draftModeEnabled && draftModePerspective) {
      setPerspective(draftModePerspective)
    } else {
      setPerspective('unknown')
    }
  }, [draftModeEnabled, draftModePerspective])

  const [loadComlink, setLoadComlink] = useState(false)
  /**
   * 3. Notify what environment we're in, when in Draft Mode
   */
  useEffect(() => {
    // If we might be in Presentation Tool, then skip detecting here as it's handled later
    if (isMaybePresentation()) return

    // If we're definitely not in Presentation Tool, then we can set the environment as stand-alone live preview
    // if we have both a browser token, and draft mode is enabled
    if (draftModeEnabled && token) {
      setEnvironment('live')
      return
    }
    // If we're in draft mode, but don't have a browser token, then we're in static mode
    // which means that published content is still live, but draft changes likely need manual refresh
    if (draftModeEnabled) {
      setEnvironment('static')
      return
    }

    // Fallback to `unknown` otherwise, as we simply don't know how it's setup
    setEnvironment('unknown')
    return
  }, [draftModeEnabled, token])

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
   * 5. Warn if draft mode is being disabled
   * @TODO move logic into PresentationComlink, or maybe VisualEditing?
   */
  const draftModeEnabledWarnRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!draftModeEnabled) return
    clearTimeout(draftModeEnabledWarnRef.current)
    return () => {
      draftModeEnabledWarnRef.current = setTimeout(() => {
        console.warn('Sanity Live: Draft mode was enabled, but is now being disabled')
      })
    }
  }, [draftModeEnabled])

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
      {draftModeEnabled && loadComlink && (
        <PresentationComlink
          projectId={projectId!}
          dataset={dataset!}
          // handleDraftModeAction={handleDraftModeAction}
          draftModeEnabled={draftModeEnabled}
          draftModePerspective={draftModePerspective!}
        />
      )}
      {!draftModeEnabled && refreshOnMount && <RefreshOnMount />}
      {!draftModeEnabled && refreshOnFocus && <RefreshOnFocus />}
      {!draftModeEnabled && refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
}
