import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  QueryParams,
  SanityClient,
  SyncTag,
  InitializedClientConfig,
  LiveEvent,
} from 'next-sanity'

/**
 * Perspectives supported by Sanity Live.
 * Using the legacy `'raw'` perspective is not supported and leads to undefined behavior.
 */
export type LivePerspective = Exclude<ClientPerspective, 'raw'>

/**
 * Use this function to fetch data from Sanity in your React Server Components.
 * When used within a `generateMetadata` or `generateViewport` function, make sure you set `stega: false`.
 * When used within a `generateStaticParams` function, make sure you set `stega: false` and `perspective: 'published'`.
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
   * @defaultValue 'published' or when in draft mode it's 'drafts' or the value of a cookie named 'sanity-preview-perspective' that is set by `defineEnableDraftMode`.
   */
  perspective?: LivePerspective
  /**
   * Enables stega encoding of the data. This is typically only used in draft
   * mode with `perspective: 'drafts'` and `@sanity/visual-editing`.
   *
   * @defaultValue `false` or when in draft mode it's `true`
   */
  stega?: boolean
  /**
   * Add custom `next.tags` to the underlying fetch request.
   * @see https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags
   * This can be used in conjunction with custom fallback revalidation strategies, as well as with custom Server Actions that mutate data and want to render with fresh data right away (faster than the Live Event latency).
   */
  tags?: string[]
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/platform-management/reference-api-request-tags
   * @defaultValue 'next-loader.fetch'
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
   * Include draft and content release version events in the live connection, instead of only published documents.
   *
   * A `browserToken` must be configured in `defineLive()` for draft events to be included.
   *
   * @defaultValue `(await draftMode()).isEnabled`
   */
  includeDrafts?: boolean
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/platform-management/reference-api-request-tags
   * @defaultValue 'next-loader.live'
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
   * Override how cache tags are invalidated, you need to pass a server action here.
   * You can also pass a `use client` function here, and have `router.refresh()` be called if the promise resolves to `'refresh'`.
   */
  revalidateSyncTags?: (tags: SyncTag[]) => Promise<void | 'refresh'>
  /**
   * Handle errors from the Live Events subscription.
   * By default it's reported using `console.error`, you can override this prop to handle it in your own way.
   */
  onError?: (error: unknown) => void
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
   * Fetch options used by `sanityFetch`
   * @deprecated this option is removed in the next major version, use `export const revalidate` on the `page.tsx` or `layout.tsx` instead
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
