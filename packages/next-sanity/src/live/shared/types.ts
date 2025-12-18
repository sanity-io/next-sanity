import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  QueryParams,
  SanityClient,
  InitializedClientConfig,
  LiveEvent,
} from 'next-sanity'

/**
 * Perspectives supported by Sanity Live.
 * Using the legacy `'raw'` perspective is not supported and leads to undefined behavior.
 */
export type LivePerspective = Exclude<ClientPerspective, 'raw'>

/**
 * Fetches data through the configured Sanity client and returns the result
 * together with the source map and cache tags that Sanity Live uses for
 * targeted revalidation.
 *
 * Returned by `defineLive({strict: false})` and `defineLive({strict: undefined})`.
 */
export type DefinedFetchType = <const QueryString extends string>(options: {
  /**
   * GROQ query to execute.
   */
  query: QueryString
  /**
   * Parameters used by the GROQ query.
   */
  params?: QueryParams | Promise<QueryParams>
  /**
   * Content perspective used for the fetch.
   *
   * @defaultValue The configured client perspective, usually `'published'`.
   */
  perspective?: LivePerspective
  /**
   * Enables stega encoding of the data. This is typically only used in draft
   * mode with `perspective: 'drafts'` and `@sanity/visual-editing`.
   *
   * @defaultValue `false`
   */
  stega?: boolean
  /**
   * Additional cache tags to associate with this fetch.
   *
   * `sanityFetch` automatically adds Sanity Live sync tags for the query. Use
   * this for custom tags that should also be invalidated by your own server
   * actions, for example after a mutation that needs read-your-own-write UI.
   */
  tags?: string[]
  /**
   * Request tag used to identify the request in Sanity Content Lake logs.
   *
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue `'next-loader.fetch'` or `'next-loader.fetch.cache-components'`
   */
  requestTag?: string
}) => Promise<{
  data: ClientReturn<QueryString, unknown>
  sourceMap: ContentSourceMap | null
  tags: string[]
}>

/**
 * Render this in your root layout.tsx to make your page refresh, or revalidate, on new content live, automatically.
 * @public
 */
export interface DefinedLiveProps {
  /**
   * Include draft and content release version events in the live connection.
   *
   * Set this to `true` when draft mode is enabled. A `browserToken` must be
   * configured in `defineLive()` for draft events to be included.
   *
   * @defaultValue `false`
   */
  includeDrafts?: boolean
  /**
   * Request tag used to identify the live EventSource request in Sanity Content
   * Lake logs.
   *
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue `'next-loader.live'` or `'next-loader.live.cache-components'`
   */
  requestTag?: string
  /**
   * Delays events until after a configured Sanity Function has processed them and called the callback endpoint.
   * When omitted, events are delivered immediately.
   *
   * @remarks
   * When set, any custom `revalidateSyncTags` will not be called — revalidation is handled by the Function instead.
   */
  waitFor?: 'function'
  /**
   * Server action called for each content-change message from the Live Content
   * API.
   *
   * The default action revalidates the cache tags produced by `sanityFetch`.
   */
  action?: SanityLiveAction
  /**
   * Custom error handler. If none is provided the error will be thrown during render and caught by the nearest React error boundary.
   */
  onError?: SanityLiveOnError
  /**
   * Custom handler for the `welcome` event. Pass `false` to disable the default
   * connection log.
   */
  onWelcome?: SanityLiveOnWelcome | false
  /**
   * Custom handler for the `reconnect` event. Pass `false` to disable the
   * default refresh behavior.
   */
  onReconnect?: SanityLiveOnReconnect | false
  /**
   * Custom handler for the `restart` event. Pass `false` to disable the default
   * refresh behavior.
   */
  onRestart?: SanityLiveOnRestart | false
  /**
   * Custom handler for the `goaway` event. Pass `false` to disable the default
   * long-polling fallback.
   */
  onGoAway?: SanityLiveOnGoaway | false
}

export interface DefineLiveOptions {
  /**
   * Sanity client used by `sanityFetch()` and `<SanityLive />`.
   */
  client: SanityClient
  /**
   * Token used by the server to query drafts and content release versions.
   *
   * This token is never shared with the browser unless you also pass it as
   * `browserToken`.
   */
  serverToken?: string | false
  /**
   * Token shared with the browser when `<SanityLive includeDrafts />` opens a
   * draft-capable live connection.
   *
   * Use a browser-safe token with the minimum read permissions needed for live
   * previewing drafts outside Presentation Tool.
   */
  browserToken?: string | false
  /**
   * Require explicit live-content options at every call site.
   *
   * When `true`, `includeDrafts` is required on `<SanityLive />` and
   * `perspective`/`stega` are required on `sanityFetch()`. This matches the
   * explicit data flow needed inside Cache Components, where `draftMode()` and
   * `cookies()` must be resolved outside `'use cache'` boundaries.
   *
   * @defaultValue `false`
   */
  strict?: boolean
}

/**
 * Like {@link DefinedLiveProps} but with `includeDrafts` required.
 * Returned by `defineLive({strict: true})`.
 */
export interface StrictDefinedLiveProps extends Omit<DefinedLiveProps, 'includeDrafts'> {
  includeDrafts: boolean
}

/**
 * Like {@link DefinedFetchType} but with `perspective` and `stega` required.
 * Returned by `defineLive({strict: true})`.
 */
export type StrictDefinedFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  perspective: LivePerspective
  stega: boolean
  tags?: string[]
  requestTag?: string
}) => Promise<{
  data: ClientReturn<QueryString, unknown>
  sourceMap: ContentSourceMap | null
  tags: string[]
}>

export interface SanityClientConfig extends Pick<
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
 * Context passed to Sanity Live event handlers.
 */
export interface SanityLiveContext {
  /**
   * Whether the current `<SanityLive />` connection includes draft and content
   * release version events.
   */
  includeDrafts: boolean
  /**
   * Whether the current `<SanityLive />` connection is waiting for a Sanity Function to process the live events.
   */
  waitFor: 'function' | undefined
}

/**
 * Server action invoked when Sanity Live receives a content-change message.
 *
 * The argument is the list of cache tags derived from the Live Content API
 * event. The default action revalidates those tags. Return `'refresh'` from a
 * custom action to also call `router.refresh()` in the browser.
 *
 * There's three types of values you can give `action`:
 * - 'use server'; export async function action() {}
 * - 'use client'; export async function action() {}
 * - 'refresh'
 *
 * If you give the string 'refresh', it's the same as if the action just `async () => 'refresh'`, which leads to <SanityLive /> calling `router.refresh()` for you
 */
export type SanityLiveAction = ((unsafeTags: unknown) => Promise<void | 'refresh'>) | 'refresh'
/**
 * Handles connection, parsing, and event-processing errors.
 *
 * If no handler is provided, the error is thrown during render so it can be
 * caught by the nearest React error boundary.
 */
export type SanityLiveOnError = (error: unknown, context: SanityLiveContext) => void
/**
 * Handles the Live Content API `welcome` event.
 *
 * This event fires when the EventSource connection is established.
 * The default event handler logs a message that adapts the message based on wether `includeDrafts` is set, and if `waitFor="function"` is set.
 * Set `<SanityLive onWelcome={false} />` to disable the default behavior.
 */
export type SanityLiveOnWelcome = (
  event: Extract<LiveEvent, {type: 'welcome'}>,
  context: SanityLiveContext,
) => void | Promise<void>
/**
 * Handles the Live Content API `reconnect` event.
 *
 * The default behavior refreshes the route so Server Components can render with
 * fresh data after reconnecting.
 */
export type SanityLiveOnReconnect =
  | ((
      event: Extract<LiveEvent, {type: 'reconnect'}>,
      context: SanityLiveContext,
    ) => void | Promise<void | 'refresh'>)
  | 'refresh'
/**
 * Handles the Live Content API `restart` event.
 *
 * The default behavior refreshes the route so Server Components can render with
 * fresh data after the Live Content API restarts.
 */
export type SanityLiveOnRestart =
  | ((
      event: Extract<LiveEvent, {type: 'restart'}>,
      context: SanityLiveContext,
    ) => void | Promise<void | 'refresh'>)
  | 'refresh'
/**
 * Handles the Live Content API `goaway` event.
 *
 * This event means the API closed the live connection and will not deliver live
 * events. This can happen when connection limits are reached. A polling refresh
 * interval is the usual fallback; call `setPollingInterval()` from a custom
 * handler to keep content fresh.
 */
export type SanityLiveOnGoaway = (
  event: Extract<LiveEvent, {type: 'goaway'}>,
  context: SanityLiveContext,
  setPollingInterval: (interval: number) => void,
) => void | Promise<void>

export type CacheTagPrefix = `${string}:`
