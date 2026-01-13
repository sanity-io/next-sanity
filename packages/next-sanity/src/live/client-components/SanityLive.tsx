import {isCorsOriginError} from '#live/isCorsOriginError'
import {createClient, type InitializedClientConfig, type LiveEventGoAway} from '@sanity/client'
import {
  isMaybePresentation,
  // isMaybePreviewWindow
} from '@sanity/presentation-comlink'
import dynamic from 'next/dynamic'
import {useEffect, useMemo, useState} from 'react'

const LiveEvents = dynamic(() => import('./LiveEvents'))
const LiveEventsIncludingDrafts = dynamic(() => import('./LiveEventsIncludingDrafts'))
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

export interface SanityLiveProps {
  config: SanityClientConfig
  includeDrafts?: boolean

  onLiveEvent: (tags: string[]) => Promise<void | 'refresh'>
  onLiveEventIncludingDrafts: (tags: string[]) => Promise<void | 'refresh'>

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
    includeDrafts,
    onLiveEvent,
    onLiveEventIncludingDrafts,
    refreshOnMount = false,
    refreshOnFocus = false,
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

  const [loadComlink, setLoadComlink] = useState(false)
  useEffect(() => {
    if (!isMaybePresentation()) return
    const controller = new AbortController()
    // Wait for a while to see if Presentation Tool is detected, before assuming the env to be stand-alone live preview
    // const timeout = setTimeout(() => setEnvironment('live'), 3_000)
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
          // clearTimeout(timeout)
          // setEnvironment(isMaybePreviewWindow() ? 'presentation-window' : 'presentation-iframe')
          setLoadComlink(true)
          controller.abort()
        }
      },
      {signal: controller.signal},
    )
    return () => {
      // clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <>
      {onLiveEvent && (
        <LiveEvents
          client={client}
          onEvent={onLiveEvent}
          requestTag={requestTag}
          onError={onError}
          onGoAway={onGoAway}
          intervalOnGoAway={intervalOnGoAway}
        />
      )}
      {includeDrafts && onLiveEventIncludingDrafts && (
        <LiveEventsIncludingDrafts
          client={client}
          onEvent={onLiveEventIncludingDrafts}
          requestTag={requestTag}
          onError={onError}
          onGoAway={onGoAway}
          intervalOnGoAway={intervalOnGoAway}
        />
      )}
      {loadComlink && <PresentationComlink projectId={projectId!} dataset={dataset!} />}
      {refreshOnMount && <RefreshOnMount />}
      {refreshOnFocus && <RefreshOnFocus />}
      {refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
}

SanityLive.displayName = 'SanityLiveClientComponent'

export default SanityLive
