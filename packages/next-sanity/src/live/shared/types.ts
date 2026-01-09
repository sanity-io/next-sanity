import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  LiveEventGoAway,
  QueryParams,
  SanityClient,
  InitializedClientConfig,
} from 'next-sanity'

/**
 * Perspectives supported by Sanity Live.
 * Using the legacy `'raw'` perspective is not supported and leads to undefined behavior.
 */
export type PerspectiveType = Exclude<ClientPerspective, 'raw'>

/**
 * TODO: docs
 */
export type DefinedFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams
  /**
   * @defaultValue 'published'
   */
  perspective?: PerspectiveType
  /**
   * Enables stega encoding of the data, this is typically only used in draft mode in conjunction with `perspective: 'drafts'` and with `@sanity/visual-editing` setup.
   * @defaultValue `false`
   */
  stega?: boolean
  /**
   * Custom cache tags that can be used with next's  `updateTag` functions for custom `read-your-write` server actions,
   * for example a like button that uses client.mutate to update a document and then immediately shows the result.
   */
  tags?: string[]
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.fetch'
   */
  requestTag?: string
}) => Promise<{
  data: ClientReturn<QueryString, unknown>
  sourceMap: ContentSourceMap | null
  tags: string[]
}>

export interface DefinedLiveProps {
  /**
   * TODO: should match the `perspective` you give `defineLive().fetch()`, setting it to a value other than `"published"`
   * and with `browserToken` set will cause it to subscribe to draft content changes as well as published content.
   */
  perspective?: PerspectiveType

  /**
   * TODO: If Presentation Tool is present this event will fire with the current `perspective` stack used in the
   * Sanity Studio global perspective menu. The default event handler will store this state in a cookie,
   * which can be read with `resolvePerspectiveFromCookies` and used to ensure data fetching in the preview
   * matches the perspective and content viewed in the Studio, allowing you to quickly switch and preview different perspectives.
   */
  onStudioPerspective?: (perspective: ClientPerspective) => Promise<void>

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
   * TODO: docs, this handles events for published content only, and can be used to revalidate content for all your users when in presentation tool
   */
  onChange?: (tags: string[]) => Promise<void | 'refresh'>

  /**
   * TODO: docs, this handles events for all changes, published, drafts and even version documents in content releases.
   * It's only used when `browserToken` is provided, and the `perspective` prop is other than `"published"`.
   * Wether you should just `refresh()` or use `updateTag` to expire tags depends on how you fetch draft content and wether it's cached or not.
   */
  onChangeIncludingDrafts?: (tags: string[]) => Promise<void | 'refresh'>
}

export interface LiveOptions {
  /**
   * Required for `fetch()` and `<Live>` to work
   */
  client: SanityClient
  /**
   * Optional. If provided then the token needs to have permissions to query documents with `drafts.` prefixes in order for `perspective: 'drafts'` to work.
   * This token is never shared with the browser, unless you reuse it in `browserToken`..
   */
  serverToken?: string | false
  /**
   * Optional. This token is shared with the browser when `<Live>` is given a `perspective` prop other than `"published"`, and should only have access to query published documents.
   * It is used to setup a `Live Draft Content` EventSource connection, and enables live previewing drafts stand-alone, outside of Presentation Tool.
   */
  browserToken?: string | false
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
