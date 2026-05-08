import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  LiveEventGoAway,
  QueryParams,
  SanityClient,
  SyncTag,
  InitializedClientConfig,
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
 * @public
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
   * Automatically refresh on an interval when the Live Event API emits a `goaway` event, which indicates that the connection is rejected or closed.
   * This typically happens if the connection limit is reached, or if the connection is idle for too long.
   * To disable this long polling fallback behavior set `intervalOnGoAway` to `false` or `0`.
   * You can also use `onGoAway` to handle the `goaway` event in your own way, and read the reason why the event was emitted.
   * @defaultValue `30_000` 30 seconds interval
   */
  intervalOnGoAway?: number | false
  /**
   * Handle the `goaway` event if the connection is rejected/closed.
   * `event.reason` will be a string of why the event was emitted, for example `'connection limit reached'`.
   * When this happens the `<SanityLive />` will fallback to long polling with a default interval of 30 seconds, providing your own `onGoAway` handler does not change this behavior.
   * If you want to disable long polling set `intervalOnGoAway` to `false` or `0`.
   */
  onGoAway?: (event: LiveEventGoAway, intervalOnGoAway: number | false) => void

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
}

/**
 * @public
 */
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
