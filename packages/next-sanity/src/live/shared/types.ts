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
export type PerspectiveType = Exclude<ClientPerspective, 'raw'>

/**
 * TODO: docs
 */
export type DefinedFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
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

/**
 * TODO: docs
 */
export interface SanityLiveActionContext {
  includeAllDocuments: boolean
}

/**
 * TODO: docs
 */
export type Logger = typeof console | Pick<typeof console, 'warn' | 'error' | 'log'>

export interface DefinedLiveProps {
  /**
   * TODO: docs, settings this to `true` enables live events for draft content and requires `browserToken` to be set.
   */
  includeAllDocuments?: boolean
  /**
   * TODO: docs
   */
  action?: (
    event: Extract<LiveEvent, {type: 'message'}>,
    context: SanityLiveActionContext,
  ) => Promise<void>
  welcomeAction?:
    | ((
        event: Extract<LiveEvent, {type: 'welcome'}>,
        context: SanityLiveActionContext,
      ) => Promise<void>)
    | false
  goAwayAction?:
    | ((
        event: Extract<LiveEvent, {type: 'goaway'}>,
        context: SanityLiveActionContext,
      ) => Promise<number | false>)
    | false
  reconnectAction?:
    | ((
        event: Extract<LiveEvent, {type: 'reconnect'}>,
        context: SanityLiveActionContext,
      ) => Promise<void>)
    | false
  restartAction?:
    | ((
        event: Extract<LiveEvent, {type: 'restart'}>,
        context: SanityLiveActionContext,
      ) => Promise<void>)
    | false

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
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.live'
   */
  requestTag?: string
}

export interface DefineLiveOptions {
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
  /**
   * Optional. Include stega encoding when draft mode is enabled.
   *  @deprecated This option is deprecated, as it does not have an effect when `cacheComponents: true`
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
