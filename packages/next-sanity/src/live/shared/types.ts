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
   * @remarks
   * Requires `serverToken` to be configured in `defineLive()`
   *
   * @defaultValue
   * The default is `'published'` unless
   *  - `Cache Components` are disabled
   *  - `defineLive()` was given a `serverToken`
   *  - `defineLive()` is not set to `strict: true`
   *  - `draftMode()` is enabled
   *
   * If all of the above conditions are met, then the default value will be resolved from attempting to read the `'sanity-preview-perspective'` cookie and fall back to `'drafts'` if not set
   */
  perspective?: LivePerspective
  /**
   * Enables stega encoding of the data. This is typically only used in draft
   * mode with `perspective: 'drafts'` and `@sanity/visual-editing`.
   *
   * @remarks
   * Requires `serverToken` to be configured in `defineLive()`
   *
   * @defaultValue
   * The default is `false` unless
   *  - `Cache Components` are disabled
   *  - `defineLive()` was given a `serverToken`
   *  - `defineLive()` is not set to `strict: true`
   *  - `defineLive()` was given a `client` that defines `stega.studioUrl`
   *  - `draftMode()` is enabled
   *
   * If all of the above conditions are met, then the default value will be `true`
   */
  stega?: boolean
  /**
   * Additional cache tags to associate with this fetch.
   *
   * @remarks
   * The default behavior will always add cache tags automatically for the query based on the `syncTags` response returned by Content Lake.
   * You only need to define custom tags if you also mutate content in a server action and need to implement read-your-own-write UI.
   * @see https://nextjs.org/docs/app/api-reference/functions/updateTag#server-action-with-read-your-own-writes
   *
   * When `cacheComponents: false` your custom tags are appended to the underlying `next.tags` array on the `fetch` request and are subject to the tag length and max tag items limits of Next.js.
   * @see https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags
   * When `cacheComponents: true` your custom tags are appended to the underlying `cacheTag()` call and are subject to the tag length and max tag items limits of Next.js.
   * @see https://nextjs.org/docs/app/api-reference/functions/cacheTag#good-to-know
   */
  tags?: string[]
  /**
   * Request tag used to identify the request in Sanity Content Lake logs.
   *
   * @see https://www.sanity.io/docs/reference-api-request-tags
   *
   * @defaultValue
   * If `cacheComponents: true` then the default value is `'next-loader.fetch.cache-components'`
   * otherwise it's `'next-loader.fetch'`
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
   * Include draft and content release version events in the live connection. Otherwise only events for published content are included.
   *
   * @remarks
   * Requires `browserToken` to be configured in `defineLive()`
   *
   * @defaultValue
   * The default is `false` unless
   *  - `Cache Components` are disabled
   *  - `defineLive()` was given a `browserToken`
   *  - `defineLive()` is not set to `strict: true`
   *  - `draftMode()` is enabled
   *
   * If all of the above conditions are met, then the default value will be `true`
   */
  includeDrafts?: boolean
  /**
   * Request tag used to identify the live EventSource request in Sanity Content Lake logs.
   *
   * @see https://www.sanity.io/docs/reference-api-request-tags
   *
   * @defaultValue
   * If `cacheComponents: true` then the default value is `'next-loader.live.cache-components'`
   * otherwise it's `'next-loader.live'`
   */
  requestTag?: string
  /**
   * Delays events until after a configured Sanity Function has processed them and called the callback endpoint.
   * When omitted, events are delivered immediately.
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
   * Custom error handler. If none is provided, errors are logged with `console.error`.
   * Pass `'throw'` to throw errors during render so they can be caught by the
   * {@link https://nextjs.org/docs/app/api-reference/functions/catchError | unstable_catchError API}.
   */
  onError?: SanityLiveOnError
  /**
   * Custom handler for the `welcome` event. Pass `false` to disable the default
   * connection log.
   */
  onWelcome?: SanityLiveOnWelcome | false
  /**
   * Custom handler for the `reconnect` event. Pass `false` to disable the
   * default log behavior.
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
 * If no handler is provided, the error is logged with `console.error`.
 * Pass `'throw'` to throw errors during render so they can be caught by the
 * {@link https://nextjs.org/docs/app/api-reference/functions/catchError | unstable_catchError API}
 * which supports `unstable_retry` for retrying the render.
 */
export type SanityLiveOnError = ((error: unknown, context: SanityLiveContext) => void) | 'throw'
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
 * The default behavior just logs the event, as it will eventually result in a `welcome` or `error` event.
 */
export type SanityLiveOnReconnect = (
  event: Extract<LiveEvent, {type: 'reconnect'}>,
  context: SanityLiveContext,
) => void | Promise<void>

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
