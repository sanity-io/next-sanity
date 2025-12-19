import {
  type ClientPerspective,
  type ClientReturn,
  type ContentSourceMap,
  type LiveEventGoAway,
  type QueryParams,
  type SanityClient,
  type SyncTag,
} from '@sanity/client'
import SanityLiveClientComponent from 'next-sanity/live/client-components/live'
import {draftMode} from 'next/headers'
import {prefetchDNS, preconnect} from 'react-dom'

import {resolveCookiePerspective} from './resolveCookiePerspective'

/**
 * @public
 */
export type DefinedSanityFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  /**
   * Add custom `next.tags` to the underlying fetch request.
   * @see https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags
   * This can be used in conjunction with custom fallback revalidation strategies, as well as with custom Server Actions that mutate data and want to render with fresh data right away (faster than the Live Event latency).
   * @defaultValue `['sanity']`
   */
  tags?: string[]
  perspective?: Exclude<ClientPerspective, 'raw'>
  stega?: boolean
  /**
   * @deprecated use `requestTag` instead
   */
  tag?: never
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.fetch'
   */
  requestTag?: string
}) => Promise<{
  data: ClientReturn<QueryString>
  sourceMap: ContentSourceMap | null
  tags: string[]
}>

/**
 * @public
 */
export interface DefinedSanityLiveProps {
  /**
   * Automatic refresh of RSC when the component <SanityLive /> is mounted.
   * Note that this is different from revalidation, which is based on tags and causes `sanityFetch` calls to be re-fetched.
   * @defaultValue `true`
   */
  refreshOnMount?: boolean
  /**
   * Automatically refresh when window gets focused
   * Note that this is different from revalidation, which is based on tags and causes `sanityFetch` calls to be re-fetched.
   * @defaultValue `false` if draftMode().isEnabled, otherwise `true` if not inside an iframe
   */
  refreshOnFocus?: boolean
  /**
   * Automatically refresh when the browser regains a network connection (via navigator.onLine)
   * Note that this is different from revalidation, which is based on tags and causes `sanityFetch` calls to be re-fetched.
   * @defaultValue `true`
   */
  refreshOnReconnect?: boolean
  /**
   * Automatically refresh on an interval when the Live Event API emits a `goaway` event, which indicates that the connection is rejected or closed.
   * This typically happens if the connection limit is reached, or if the connection is idle for too long.
   * To disable this long polling fallback behavior set `intervalOnGoAway` to `false` or `0`.
   * You can also use `onGoAway` to handle the `goaway` event in your own way, and read the reason why the event was emitted.
   * @defaultValue `30_000` 30 seconds interval
   */
  intervalOnGoAway?: number | false

  /**
   * @deprecated use `requestTag` instead
   */
  tag?: never

  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.live'
   */
  requestTag?: string

  /**
   * Handle errors from the Live Events subscription.
   * By default it's reported using `console.error`, you can override this prop to handle it in your own way.
   */
  onError?: (error: unknown) => void

  /**
   * Handle the `goaway` event if the connection is rejected/closed.
   * `event.reason` will be a string of why the event was emitted, for example `'connection limit reached'`.
   * When this happens the `<SanityLive />` will fallback to long polling with a default interval of 30 seconds, providing your own `onGoAway` handler does not change this behavior.
   * If you want to disable long polling set `intervalOnGoAway` to `false` or `0`.
   */
  onGoAway?: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void

  /**
   * Override how cache tags are invalidated, you need to pass a server action here.
   * You can also pass a `use client` function here, and have `router.refresh()` be called if the promise resolves to `'refresh'`.
   */
  revalidateSyncTags?: (tags: SyncTag[]) => Promise<void | 'refresh'>
}

/**
 * @public
 */
export interface DefineSanityLiveOptions {
  /**
   * Required for `sanityFetch` and `SanityLive` to work
   */
  client: SanityClient
  /**
   * Optional. If provided then the token needs to have permissions to query documents with `drafts.` prefixes in order for `perspective: 'drafts'` to work.
   * This token is not shared with the browser.
   */
  serverToken?: string | false
  /**
   * Optional. This token is shared with the browser, and should only have access to query published documents.
   * It is used to setup a `Live Draft Content` EventSource connection, and enables live previewing drafts stand-alone, outside of Presentation Tool.
   */
  browserToken?: string | false
  /**
   * Fetch options used by `sanityFetch`
   */
  fetchOptions?: {
    /**
     * Optional, enables time based revalidation in addition to the EventSource connection.
     * @defaultValue `false`
     */
    revalidate?: number | false
  }
  /**
   * Optional. Include stega encoding when draft mode is enabled.
   *  @defaultValue `true`
   */
  stega?: boolean
}

// export type VerifyPreviewSecretType = (
//   secret: string,
// ) => Promise<{isValid: boolean; studioUrl: string | null}>

/**
 * @public
 */
export function defineLive(config: DefineSanityLiveOptions): {
  /**
   * Use this function to fetch data from Sanity in your React Server Components.
   * @public
   */
  sanityFetch: DefinedSanityFetchType
  /**
   * Render this in your root layout.tsx to make your page revalidate on new content live, automatically.
   * @public
   */
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
} {
  const {
    client: _client,
    serverToken,
    browserToken,
    fetchOptions,
    stega: stegaEnabled = true,
  } = config

  if (!_client) {
    throw new Error('`client` is required for `defineLive` to function')
  }

  if (process.env.NODE_ENV !== 'production' && !serverToken && serverToken !== false) {
    console.warn(
      'No `serverToken` provided to `defineLive`. This means that only published content will be fetched and respond to live events. You can silence this warning by setting `serverToken: false`.',
    )
  }

  if (process.env.NODE_ENV !== 'production' && !browserToken && browserToken !== false) {
    console.warn(
      'No `browserToken` provided to `defineLive`. This means that live previewing drafts will only work when using the Presentation Tool in your Sanity Studio. To support live previewing drafts stand-alone, provide a `browserToken`. It is shared with the browser so it should only have Viewer rights or lower. You can silence this warning by setting `browserToken: false`.',
    )
  }

  const client = _client.withConfig({allowReconfigure: false, useCdn: false})
  const {token: originalToken} = client.config()
  const studioUrlDefined = typeof client.config().stega.studioUrl !== 'undefined'

  const sanityFetch: DefinedSanityFetchType = async function sanityFetch<
    const QueryString extends string,
  >({
    query,
    params = {},
    stega: _stega,
    tags = ['sanity'],
    perspective: _perspective,
    tag,
    requestTag = tag ?? 'next-loader.fetch',
  }: {
    query: QueryString
    params?: QueryParams | Promise<QueryParams>
    stega?: boolean
    tags?: string[]
    perspective?: Exclude<ClientPerspective, 'raw'>
    tag?: string
    requestTag?: string
  }) {
    const stega = _stega ?? (stegaEnabled && studioUrlDefined && (await draftMode()).isEnabled)
    const perspective = _perspective ?? (await resolveCookiePerspective())
    const useCdn = perspective === 'published'
    const revalidate =
      fetchOptions?.revalidate !== undefined
        ? fetchOptions.revalidate
        : process.env.NODE_ENV === 'production'
          ? false
          : undefined

    // fetch the tags first, with revalidate to 1s to ensure we get the latest tags, eventually
    const {syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective: perspective as ClientPerspective,
      stega: false,
      returnQuery: false,
      next: {revalidate, tags: [...tags, 'sanity:fetch-sync-tags']},
      useCdn,
      cacheMode: useCdn ? 'noStale' : undefined,
      tag: [requestTag, 'fetch-sync-tags'].filter(Boolean).join('.'),
    })

    const cacheTags = [...tags, ...(syncTags?.map((tag) => `sanity:${tag}`) || [])]

    const {result, resultSourceMap} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective: perspective as ClientPerspective,
      stega,
      token: perspective !== 'published' && serverToken ? serverToken : originalToken,
      next: {revalidate, tags: cacheTags},
      useCdn,
      cacheMode: useCdn ? 'noStale' : undefined,
      tag: requestTag,
    })
    return {data: result, sourceMap: resultSourceMap || null, tags: cacheTags}
  }

  const SanityLive: React.ComponentType<DefinedSanityLiveProps> = async function SanityLive(props) {
    const {
      // handleDraftModeAction = handleDraftModeActionMissing
      refreshOnMount,
      refreshOnFocus,
      refreshOnReconnect,
      tag,
      requestTag = tag,
      onError,
      onGoAway,
      intervalOnGoAway,
      revalidateSyncTags,
    } = props
    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()
    const {isEnabled: isDraftModeEnabled} = await draftMode()

    // Preconnect to the Live Event API origin, or at least prefetch the DNS if preconenct is not supported
    const {origin} = new URL(client.getUrl('', false))
    preconnect(origin)
    prefetchDNS(origin)

    return (
      <SanityLiveClientComponent
        projectId={projectId}
        dataset={dataset}
        apiHost={apiHost}
        apiVersion={apiVersion}
        useProjectHostname={useProjectHostname}
        requestTagPrefix={requestTagPrefix}
        requestTag={requestTag}
        token={typeof browserToken === 'string' && isDraftModeEnabled ? browserToken : undefined}
        draftModeEnabled={isDraftModeEnabled}
        // handleDraftModeAction={handleDraftModeAction}
        draftModePerspective={await resolveCookiePerspective()}
        refreshOnMount={refreshOnMount}
        refreshOnFocus={refreshOnFocus}
        refreshOnReconnect={refreshOnReconnect}
        onError={onError}
        onGoAway={onGoAway}
        intervalOnGoAway={intervalOnGoAway}
        revalidateSyncTags={revalidateSyncTags}
      />
    )
  }

  return {
    sanityFetch,
    SanityLive,
  }
}
