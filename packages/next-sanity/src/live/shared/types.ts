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
 * Has a default implementation tailed the nextjs env and config
 */
export type SanityLiveAction = (
  event: Extract<LiveEvent, {type: 'message'}>,
  context: SanityLiveActionContext,
) => Promise<void>
/**
 * TODO: docs
 * If not defined it'll throw the error during render instead, which will crash the react app
 * unless there's an <ErrorBoundary> surrounding the <SanityLive> component
 */
export type SanityLiveOnError = (
  event: unknown,
  context: SanityLiveActionContext,
) => void | Promise<void>
/**
 * TODO: docs
 * Optional, logs console.info by default
 */
export type SanityLiveOnWelcome = (
  event: Extract<LiveEvent, {type: 'welcome'}>,
  context: SanityLiveActionContext,
) => void | Promise<void>
/**
 * TODO: docs
 */
export type SanityLiveOnReconnect = (
  event: Extract<LiveEvent, {type: 'reconnect'}>,
  context: SanityLiveActionContext,
) => void | Promise<void>
/**
 * TODO: docs
 */
export type SanityLiveOnRestart = (
  event: Extract<LiveEvent, {type: 'restart'}>,
  context: SanityLiveActionContext,
) => void | Promise<void>
/**
 * TODO: docs
 * This event is fired when the API has hit the limit of concurrent connections, and the API will not deliver live events, in this case long polling intervals is a possible fallback strategy.
 * By default a message will be logged to the console, that creates a refresh interval of 30 seconds.
 * If you set your own event handler make sure you call `setPollingInterval` if you want to activate long-polling, otherwise content goes stale.
 */
export type SanityLiveOnGoaway = (
  event: Extract<LiveEvent, {type: 'goaway'}>,
  context: SanityLiveActionContext,
  setPollingInterval: (interval: number) => void,
) => void | Promise<void>

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
  action?: SanityLiveAction
  /**
   * TODO: docs
   */
  onError?: SanityLiveOnError | false
  /**
   * TODO: docs
   */
  onWelcome?: SanityLiveOnWelcome | false
  /**
   * TODO: docs
   */
  onReconnect?: SanityLiveOnReconnect | false
  /**
   * TODO: docs
   */
  onRestart?: SanityLiveOnRestart | false
  /**
   *
   */
  onGoAway?: SanityLiveOnGoaway | false

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
   * @defaultValue 'next-loader.live'|'next-loader.live.cache-components'
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
