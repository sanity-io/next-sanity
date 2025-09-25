// oxlint-disable-next-line no-unassigned-import
import 'server-only'
import {
  createClient,
  type ClientPerspective,
  type ClientReturn,
  type ContentSourceMap,
  type LiveEventGoAway,
  type QueryParams,
  type SanityClient,
  type SyncTag,
} from 'next-sanity'
import {stegaEncodeSourceMap} from '@sanity/client/stega'
import SanityLiveClientComponent, {
  type SanityLiveProps,
} from 'next-sanity/experimental/client-components/live'
import {unstable_cacheTag as cacheTag, unstable_expireTag as expireTag} from 'next/cache'
import {draftMode, cookies} from 'next/headers'
import {preconnect} from 'react-dom'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {sanitizePerspective} from '../live/utils'
import type {SanityClientConfig} from './types'
import {DRAFT_SYNC_TAG_PREFIX, PUBLISHED_SYNC_TAG_PREFIX} from './constants'

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export async function resolvePerspectiveFromCookie({
  cookies: jar,
}: {
  cookies: Awaited<ReturnType<typeof cookies>>
}): Promise<Exclude<ClientPerspective, 'raw'>> {
  return jar.has(perspectiveCookieName)
    ? sanitizePerspective(jar.get(perspectiveCookieName)?.value, 'drafts')
    : 'drafts'
}

async function sanityCachedFetch<const QueryString extends string>(
  config: SanityClientConfig,
  {
    query,
    params = {},
    perspective,
    stega,
    requestTag,
    draftToken,
    customCacheTags = [],
  }: {
    query: QueryString
    params?: QueryParams
    perspective: Exclude<ClientPerspective, 'raw'>
    stega: boolean
    requestTag: string
    draftToken?: string | false | undefined
    customCacheTags?: string[]
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
  // cacheLife({
  //   stale: Infinity,
  //   revalidate: Infinity,
  //   expire: Infinity,
  // })

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
  const tags = [
    ...customCacheTags,
    ...(syncTags || []).map(
      (tag) =>
        `${perspective === 'published' ? PUBLISHED_SYNC_TAG_PREFIX : DRAFT_SYNC_TAG_PREFIX}${tag}`,
    ),
  ]
  /**
   * The tags used here, are expired later on in the `expireTags` Server Action with the `expireTag` function from `next/cache`
   */
  cacheTag(...tags)

  return {data: result, sourceMap: resultSourceMap || null, tags}
}

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export type DefinedSanityFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  perspective?: Exclude<ClientPerspective, 'raw'>
  /**
   * Enables stega encoding of the data, this is typically only used in draft mode.
   * If `defineLive({..., stega: true})` is provided, then it defaults to `true` in Draft Mode.
   * If `defineLive({..., stega: false})` then it defaults to `false`.
   */
  stega?: boolean
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.fetch'
   */
  requestTag?: string
  /**
   * Custom cache tags that can be used with next's `revalidateTag` function for custom webhook on-demand revalidation.
   */
  tags?: string[]
}) => Promise<{
  data: ClientReturn<QueryString, unknown>
  /**
   * The Content Source Map can be used for custom setups like `encodeSourceMap` for `data-sanity` attributes, or `stegaEncodeSourceMap` for stega encoding in your own way.
   * The Content Source Map is only fetched by default in draft mode, if `stega` is `true`. Otherwise your client configuration will need to have `resultSourceMap: 'withKeyArraySelector' | true`
   */
  sourceMap: ContentSourceMap | null
  /**
   * The perspective used to fetch the data, useful for debugging.
   */
  perspective: Exclude<ClientPerspective, 'raw'>
  /**
   * The cache tags used with `next/cache`, useful for debugging.
   */
  tags: string[]
}>

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export interface DefinedSanityLiveProps {
  /**
   * Automatic refresh of RSC when the component <SanityLive /> is mounted.
   * @defaultValue `false`
   */
  refreshOnMount?: boolean
  /**
   * Automatically refresh when window gets focused
   * @defaultValue `false`
   */
  refreshOnFocus?: boolean
  /**
   * Automatically refresh when the browser regains a network connection (via navigator.onLine)
   * @defaultValue `false`
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
  // @TODO remove, replace with onLiveEvent
  revalidateSyncTags?: (
    tags: `${typeof PUBLISHED_SYNC_TAG_PREFIX | typeof DRAFT_SYNC_TAG_PREFIX}${SyncTag}`[],
  ) => Promise<void | 'refresh'>

  // @TODO add
  // decide how to handle a live event coming in
  // onLiveEvent?: (event: LiveEvent, mode: 'production' | 'preview) => void

  /**
   * Control how the draft mode perspective is resolved, by default it resolves from the `sanity-preview-perspective` cookie.
   */
  resolveDraftModePerspective?: () => Promise<ClientPerspective>
}

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
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
   *  @defaultValue `true` if the client configuration has the `stega.studioUrl` property set, otherwise `false`
   */
  stega?: boolean
}

/**
 * @alpha CAUTION: This API does not follow semver and could have breaking changes in future minor releases.
 */
export function defineLive(config: DefineSanityLiveOptions): {
  /**
   * Use this function to fetch data from Sanity in your React Server Components.
   */
  sanityFetch: DefinedSanityFetchType
  /**
   * Render this in your root layout.tsx to make your page revalidate on new content live, automatically.
   */
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
} {
  const {client: _client, serverToken, browserToken} = config

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
  const {stega: stegaEnabled = typeof client.config().stega.studioUrl !== 'undefined'} = config

  const sanityFetch: DefinedSanityFetchType = async function sanityFetch<
    const QueryString extends string,
  >({
    query,
    params = {},
    stega: _stega,
    tags: customCacheTags = [],
    perspective: _perspective,
    requestTag = 'next-loader.fetch',
  }: {
    query: QueryString
    params?: QueryParams | Promise<QueryParams>
    stega?: boolean
    tags?: string[]
    perspective?: Exclude<ClientPerspective, 'raw'>
    requestTag?: string
  }) {
    const stega = _stega ?? (stegaEnabled && studioUrlDefined && (await draftMode()).isEnabled)
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
      {
        query,
        params: await params,
        perspective,
        stega,
        requestTag,
        draftToken: serverToken,
        customCacheTags,
      },
    )

    const data =
      stega && sourceMap
        ? stegaEncodeSourceMap(_data, sourceMap, {...stegaConfig, enabled: true})
        : _data

    return {data, sourceMap, tags, perspective}
  }

  const SanityLive: React.ComponentType<DefinedSanityLiveProps> = function SanityLive(props) {
    const {
      // perspective,
      refreshOnMount = false,
      refreshOnFocus = false,
      refreshOnReconnect = false,
      requestTag,
      onError,
      onGoAway,
      intervalOnGoAway,
      revalidateSyncTags = expireTags,
    } = props

    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()
    const {origin} = new URL(client.getUrl('', false))

    // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    preconnect(origin)

    return (
      <SanityLiveServerComponent
        config={{projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix}}
        requestTag={requestTag}
        browserToken={browserToken}
        // origin={origin}
        refreshOnMount={refreshOnMount}
        refreshOnFocus={refreshOnFocus}
        refreshOnReconnect={refreshOnReconnect}
        onError={onError}
        onGoAway={onGoAway}
        intervalOnGoAway={intervalOnGoAway}
        revalidateSyncTags={revalidateSyncTags}
        resolveDraftModePerspective={
          props.resolveDraftModePerspective ?? resolveDraftModePerspective
        }
      />
    )
  }

  return {sanityFetch, SanityLive}
}

interface SanityLiveServerComponentProps
  extends Omit<SanityLiveProps, 'draftModeEnabled' | 'token' | 'draftModePerspective'> {
  browserToken: string | false | undefined
  // origin: string
  // perspective?: Exclude<ClientPerspective, 'raw'>
}

const SanityLiveServerComponent: React.ComponentType<SanityLiveServerComponentProps> =
  async function SanityLiveServerComponent(props) {
    'use cache'
    // @TODO should this be 'max' instead?, or configured by changing the default cache profile?
    // cacheLife({
    //   stale: Infinity,
    //   revalidate: Infinity,
    //   expire: Infinity,
    // })
    const {
      config,
      requestTag,
      intervalOnGoAway,
      onError,
      onGoAway,
      refreshOnFocus,
      refreshOnMount,
      refreshOnReconnect,
      revalidateSyncTags,
      browserToken,
      // origin,
      // perspective,
      resolveDraftModePerspective,
    } = props

    const {isEnabled: isDraftModeEnabled} = await draftMode()

    // // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    // preconnect(origin)

    return (
      <SanityLiveClientComponent
        config={{
          ...config,
          token: typeof browserToken === 'string' && isDraftModeEnabled ? browserToken : undefined,
        }}
        requestTag={requestTag}
        draftModeEnabled={isDraftModeEnabled}
        refreshOnMount={refreshOnMount}
        refreshOnFocus={refreshOnFocus}
        refreshOnReconnect={refreshOnReconnect}
        onError={onError}
        onGoAway={onGoAway}
        intervalOnGoAway={intervalOnGoAway}
        revalidateSyncTags={revalidateSyncTags}
        resolveDraftModePerspective={resolveDraftModePerspective}
      />
    )
  }

// @TODO expose parseTags function that returns the correct array of tags
// we already have s1: prefixes, but they could change
// use sp: for prod, sd: for draft, keep em short
async function expireTags(_tags: unknown): Promise<void> {
  'use server'
  // @TODO Draft Mode bypasses cache anyway so we don't bother with expiring tags for draft content
  // const isDraftMode = (await draftMode()).isEnabled
  // const tags = _tags.map((tag) => `${isDraftMode ? 'drafts' : 'sanity'}:${tag}`)
  if (!Array.isArray(_tags)) {
    console.warn('<SanityLive /> `expireTags` called with non-array tags', _tags)
    return undefined
  }
  const tags = _tags.filter(
    (tag) => typeof tag === 'string' && tag.startsWith(PUBLISHED_SYNC_TAG_PREFIX),
  )
  if (!tags.length) {
    console.warn('<SanityLive /> `expireTags` called with no valid tags', _tags)
    return undefined
  }
  expireTag(...tags)
  console.log(`<SanityLive /> expired tags: ${tags.join(', ')}`)
}

async function resolveDraftModePerspective(): Promise<ClientPerspective> {
  'use server'
  if ((await draftMode()).isEnabled) {
    const jar = await cookies()
    return resolvePerspectiveFromCookie({cookies: jar})
  }
  return 'published'
}

/**
 * Add more stuff:
 * - sanityFetchMetadata: sanityFetch({query, params, stega: false, perspective: 'auto'})
 * - sanityFetchStaticParams: sanityFetch({query, params, stega: false, perspective: 'published', cacheMode: undefined})
 * - sanityFetchCached: sanityFetch({query, params, stega: 'opt-in',perspective: 'opt-in'}) useful for 'use cache' components, no unexpected magic, maybe this will be `sanityFetch` instead
 * - sanityFetchDynamic: sanityFetch({query, params, stega: 'auto', perspective: 'auto'}) just like sanityFetch of old, since `sanityFetch` will likely become opt-in
 */
