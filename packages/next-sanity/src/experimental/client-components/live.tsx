'use client'

import {
  createClient,
  type ClientPerspective,
  type LiveEvent,
  type LiveEventGoAway,
  type SyncTag,
} from '@sanity/client'
import {isMaybePresentation, isMaybePreviewWindow} from '@sanity/presentation-comlink'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'
import {useEffectEvent} from 'use-effect-event'
import {setEnvironment, setPerspective} from '../../live/hooks/context'
import {isCorsOriginError} from '../../isCorsOriginError'
import type {SanityClientConfig} from '../types'
import {sanitizePerspective} from '../../live/utils'
import {PUBLISHED_SYNC_TAG_PREFIX, type DRAFT_SYNC_TAG_PREFIX} from '../constants'

const PresentationComlink = dynamic(() => import('./PresentationComlink'), {ssr: false})
const RefreshOnMount = dynamic(() => import('../../live/client-components/live/RefreshOnMount'), {
  ssr: false,
})
const RefreshOnFocus = dynamic(() => import('../../live/client-components/live/RefreshOnFocus'), {
  ssr: false,
})
const RefreshOnReconnect = dynamic(
  () => import('../../live/client-components/live/RefreshOnReconnect'),
  {ssr: false},
)

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export interface SanityLiveProps {
  config: SanityClientConfig
  draftModeEnabled: boolean
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
  revalidateSyncTags: (
    tags: `${typeof PUBLISHED_SYNC_TAG_PREFIX | typeof DRAFT_SYNC_TAG_PREFIX}${SyncTag}`[],
  ) => Promise<void | 'refresh'>
  resolveDraftModePerspective: () => Promise<ClientPerspective>
}

function handleError(error: unknown) {
  /* eslint-disable no-console */
  if (isCorsOriginError(error)) {
    console.warn(
      `Sanity Live is unable to connect to the Sanity API as the current origin - ${window.origin} - is not in the list of allowed CORS origins for this Sanity Project.`,
      error.addOriginUrl && `Add it here:`,
      error.addOriginUrl?.toString(),
    )
  } else {
    console.error(error)
  }
  /* eslint-enable no-console */
}

function handleOnGoAway(event: LiveEventGoAway, intervalOnGoAway: number | false) {
  /* eslint-disable no-console */
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
  /* eslint-enable no-console */
}

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export default function SanityLive(props: SanityLiveProps): React.JSX.Element | null {
  const {
    config,
    draftModeEnabled,
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
    revalidateSyncTags,
    resolveDraftModePerspective,
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
  const [resolvedInitialPerspective, setResolvedInitialPerspective] = useState(false)

  /**
   * 1. Handle Live Events and call revalidateTag or router.refresh when needed
   */
  const router = useRouter()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    if (process.env.NODE_ENV !== 'production' && event.type === 'welcome') {
      // eslint-disable-next-line no-console
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
      revalidateSyncTags(
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

  /**
   * 2. Notify what perspective we're in, when in Draft Mode
   */
  useEffect(() => {
    if (resolvedInitialPerspective) return undefined

    if (!draftModeEnabled) {
      setResolvedInitialPerspective(true)
      setPerspective('unknown')
      return undefined
    }

    const controller = new AbortController()
    resolveDraftModePerspective()
      .then((perspective) => {
        if (controller.signal.aborted) return
        setResolvedInitialPerspective(true)
        setPerspective(sanitizePerspective(perspective, 'drafts'))
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        console.error('Failed to resolve draft mode perspective', err)
        setResolvedInitialPerspective(true)
        setPerspective('unknown')
      })
    return () => controller.abort()
  }, [draftModeEnabled, resolveDraftModePerspective, resolvedInitialPerspective])

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
        // eslint-disable-next-line no-console
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
      {draftModeEnabled && loadComlink && resolvedInitialPerspective && (
        <PresentationComlink
          projectId={projectId!}
          dataset={dataset!}
          draftModeEnabled={draftModeEnabled}
        />
      )}
      {!draftModeEnabled && refreshOnMount && <RefreshOnMount />}
      {!draftModeEnabled && refreshOnFocus && <RefreshOnFocus />}
      {!draftModeEnabled && refreshOnReconnect && <RefreshOnReconnect />}
    </>
  )
}
