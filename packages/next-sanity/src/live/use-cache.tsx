import {
  createClient,
  type ClientPerspective,
  type ClientReturn,
  type ContentSourceMap,
  type InitializedClientConfig,
  type LiveEventGoAway,
  type QueryParams,
  type SanityClient,
  type SyncTag,
} from '@sanity/client'
import {stegaEncodeSourceMap} from '@sanity/client/stega'
import SanityLiveClientComponent, {
  type SanityLiveProps,
} from '@sanity/next-loader/client-components/live'
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  unstable_expireTag as expireTag,
} from 'next/cache'
import {draftMode} from 'next/headers'
import {preconnect} from 'react-dom'

export {sanitizePerspective, resolveCookiePerspective} from './resolveCookiePerspective'
export {isCorsOriginError} from './isCorsOriginError'

interface SanityClientConfig
  extends Pick<
    InitializedClientConfig,
    | 'projectId'
    | 'dataset'
    | 'apiHost'
    | 'apiVersion'
    | 'useProjectHostname'
    | 'token'
    | 'requestTagPrefix'
  > {}

async function sanityCachedFetch<const QueryString extends string>(
  config: SanityClientConfig,
  {
    query,
    params = {},
    perspective,
    stega,
    requestTag,
    draftToken,
  }: {
    query: QueryString
    params?: QueryParams
    perspective: Exclude<ClientPerspective, 'raw'>
    stega: boolean
    requestTag: string
    draftToken?: string | false | undefined
  },
): Promise<{
  data: ClientReturn<QueryString, unknown>
  sourceMap: ContentSourceMap | null
  tags: string[]
}> {
  'use cache'

  const client = createClient({...config, useCdn: true})
  const useCdn = perspective === 'published'
  /**
   * The default cache profile isn't ideal for live content, as it has unnecessary time based background validation, as well as a too lazy client stale value
   * https://github.com/vercel/next.js/blob/8dd358002baf4244c0b2e38b5bda496daf60dacb/packages/next/cache.d.ts#L14-L26
   */
  cacheLife({
    stale: Infinity,
    revalidate: Infinity,
    expire: Infinity,
  })

  const {result, resultSourceMap, syncTags} = await client.fetch(query, params, {
    filterResponse: false,
    returnQuery: false,
    perspective,
    useCdn,
    resultSourceMap: stega ? 'withKeyArraySelector' : undefined, // @TODO allow passing csm for non-stega use
    cacheMode: useCdn ? 'noStale' : undefined,
    tag: requestTag,
    token: perspective === 'published' ? config.token : draftToken || config.token, // @TODO can pass undefined instead of config.token here?
  })
  const tags = (syncTags || []).map((tag) => `sanity:${tag}`)
  /**
   * The tags used here, are expired later on in the `expireTags` Server Action with the `expireTag` function from `next/cache`
   */
  cacheTag(...tags)

  return {data: result, sourceMap: resultSourceMap || null, tags}
}

/**
 * @public
 */
export type DefinedSanityFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  perspective?: Exclude<ClientPerspective, 'raw'>
  stega?: boolean
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.fetch'
   */
  requestTag?: string
}) => Promise<{
  data: ClientReturn<QueryString, unknown>
  sourceMap: ContentSourceMap | null
  perspective: Exclude<ClientPerspective, 'raw'>
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

  draftModePerspective?: Exclude<ClientPerspective, 'raw'>
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
   * Optional. Include stega encoding when draft mode is enabled.
   *  @defaultValue `true`
   */
  stega?: boolean
}

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
  const {client: _client, serverToken, browserToken, stega: stegaEnabled = true} = config

  if (!_client) {
    throw new Error('`client` is required for `defineLive` to function')
  }

  if (process.env.NODE_ENV !== 'production' && !serverToken && serverToken !== false) {
    // eslint-disable-next-line no-console
    console.warn(
      'No `serverToken` provided to `defineLive`. This means that only published content will be fetched and respond to live events. You can silence this warning by setting `serverToken: false`.',
    )
  }

  if (process.env.NODE_ENV !== 'production' && !browserToken && browserToken !== false) {
    // eslint-disable-next-line no-console
    console.warn(
      'No `browserToken` provided to `defineLive`. This means that live previewing drafts will only work when using the Presentation Tool in your Sanity Studio. To support live previewing drafts stand-alone, provide a `browserToken`. It is shared with the browser so it should only have Viewer rights or lower. You can silence this warning by setting `browserToken: false`.',
    )
  }

  const client = _client.withConfig({allowReconfigure: false, useCdn: false})
  const {token: originalToken, stega: stegaConfig} = client.config()
  const studioUrlDefined = typeof client.config().stega.studioUrl !== 'undefined'

  const sanityFetch: DefinedSanityFetchType = async function sanityFetch<
    const QueryString extends string,
  >({
    query,
    params = {},
    stega: _stega,
    // tags = [],
    perspective: _perspective,
    requestTag = 'next-loader.fetch',
  }: {
    query: QueryString
    params?: QueryParams | Promise<QueryParams>
    stega?: boolean
    // tags?: string[]
    perspective?: Exclude<ClientPerspective, 'raw'>
    requestTag?: string
  }) {
    console.log('sanityFetch')
    const stega = _stega ?? (stegaEnabled && studioUrlDefined && (await draftMode()).isEnabled)
    // const perspective = _perspective ?? (await resolveCookiePerspective())
    const perspective = _perspective ?? ((await draftMode()).isEnabled ? 'drafts' : 'published')

    const {apiHost, apiVersion, useProjectHostname, dataset, projectId, requestTagPrefix} =
      client.config()
    const {
      data: _data,
      sourceMap,
      tags,
    } = await sanityCachedFetch(
      {
        apiHost,
        apiVersion,
        useProjectHostname,
        dataset,
        projectId,
        requestTagPrefix,
        token: originalToken,
      },
      {query, params: await params, perspective, stega, requestTag, draftToken: serverToken},
    )

    const data = stega && sourceMap ? stegaEncodeSourceMap(_data, sourceMap, stegaConfig) : _data

    console.log('after sanityCachedFetch')

    return {data, sourceMap, tags, perspective}
  }

  const SanityLive: React.ComponentType<DefinedSanityLiveProps> = function SanityLive(props) {
    const {
      // handleDraftModeAction = handleDraftModeActionMissing
      draftModePerspective = 'drafts',
      refreshOnMount,
      refreshOnFocus,
      refreshOnReconnect,
      requestTag,
      onError,
      onGoAway,
      intervalOnGoAway,
      revalidateSyncTags = expireTags,
    } = props

    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()
    const {origin} = new URL(client.getUrl('', false))

    console.log('SanityLive')

    // @TODO should wrap in Suspense?

    return (
      <SanityLiveServerComponent
        // draftModePerspective={await resolveCookiePerspective()}
        draftModePerspective={draftModePerspective}
        projectId={projectId}
        dataset={dataset}
        apiHost={apiHost}
        apiVersion={apiVersion}
        useProjectHostname={useProjectHostname}
        requestTagPrefix={requestTagPrefix}
        requestTag={requestTag}
        browserToken={browserToken}
        origin={origin}
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

  return {sanityFetch, SanityLive}
}

interface SanityLiveServerComponentProps
  extends Omit<SanityLiveProps, 'draftModeEnabled' | 'token'> {
  browserToken: string | false | undefined
  origin: string
}

const SanityLiveServerComponent: React.ComponentType<SanityLiveServerComponentProps> =
  async function SanityLiveServerComponent(props) {
    'use cache'
    // @TODO should this be 'max' instead?
    cacheLife({
      stale: Infinity,
      revalidate: Infinity,
      expire: Infinity,
    })
    console.log('SanityLiveServerComponent')
    const {
      apiHost,
      apiVersion,
      requestTag,
      useProjectHostname,
      dataset,
      intervalOnGoAway,
      onError,
      onGoAway,
      projectId,
      refreshOnFocus,
      refreshOnMount,
      refreshOnReconnect,
      requestTagPrefix,
      revalidateSyncTags,
      browserToken,
      origin,
      draftModePerspective,
    } = props

    // @TODO allow passing isDraftModeEnabled as a prop so we don't need to call draftMode() in here and thus have cacheComponents throw complaints
    const {isEnabled: isDraftModeEnabled} = await draftMode()

    // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    preconnect(origin)

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
        // @TODO do this from a server action instead? to work around cacheComponents
        // draftModePerspective={await resolveCookiePerspective()}
        // draftModePerspective="drafts"
        draftModePerspective={draftModePerspective}
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

export async function expireTags(tags: SyncTag[]) {
  'use server'
  expireTag(...tags)
  console.log(`<SanityLive /> expired tags: ${tags.join(', ')}`)
}
