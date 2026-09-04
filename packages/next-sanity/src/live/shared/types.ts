import type {StegaBranded} from '@sanity/client/stega'
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
 * Like `ClientReturnStega` from `@sanity/client/stega`, but composed from the
 * main-entry {@link ClientReturn} so `SanityQueries` TypeGen augmentations on
 * `@sanity/client` apply. The stega subpath ships a bundled `ClientReturn` that
 * does not see those augmentations.
 */
type FetchClientReturnStega<QueryString extends string> = StegaBranded<
  ClientReturn<QueryString, unknown>
>

/**
 * Perspectives supported by Sanity Live.
 * Using the legacy `'raw'` perspective is not supported and leads to undefined behavior.
 */
export type LivePerspective = Exclude<ClientPerspective, 'raw'>

export type DefinedFetchResult<Data> = Promise<{
  data: Data
  sourceMap: ContentSourceMap | null
  tags: string[]
}>

/**
 * Options accepted by `sanityFetch()`.
 *
 * `draftMode()` decides the default of `perspective`, `variant`, and `stega`.
 * An explicit value always wins, in either direction.
 */
interface DefinedFetchOptions<QueryString extends string> {
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
   * Non-`'published'` perspectives require `serverToken` to be configured in `defineLive()`
   *
   * @defaultValue
   * `'published'` outside draft mode, or when `defineLive()` has no `serverToken`.
   *
   * Inside draft mode the default comes from the `perspective` resolver given
   * to `defineLive()`, sanitized and falling back to `'drafts'`. Without a
   * resolver it comes from the `'sanity-preview-perspective'` cookie when
   * `cacheComponents` is off, and is `'drafts'` when `cacheComponents` is on,
   * because `cookies()` cannot be read inside `'use cache'`.
   */
  perspective?: LivePerspective
  /**
   * Editing variant used for the fetch, as the bare variant id (e.g. `Ab12cd34`).
   *
   * @remarks
   * Requires `serverToken` to be configured in `defineLive()`
   *
   * @defaultValue
   * `undefined` (no variant, base content) outside draft mode, when
   * `defineLive()` has a `perspective` resolver, when `cacheComponents` is on,
   * or when `perspective` is passed explicitly (an explicit `perspective` opts
   * out of cookie reads so a fetch with explicit options stays free of
   * request-scoped reads).
   *
   * Otherwise, inside draft mode with `cacheComponents` off, it is read from
   * the `'sanity-preview-variant'` cookie.
   */
  variant?: string
  /**
   * Enables stega encoding of the data. This is typically only used in draft
   * mode with `perspective: 'drafts'` and `@sanity/visual-editing`.
   *
   * Unless this option is the literal `false`, the returned `data` is
   * stega-branded (`StegaBranded<ClientReturn<...>>`): strings that may carry
   * stega payloads are typed as `StegaString` and must be cleaned with
   * `stegaClean` before they can be compared against string literals. Pass the
   * literal `stega: false` to keep clean TypeGen / {@link ClientReturn} types.
   *
   * @remarks
   * Requires `serverToken` to be configured in `defineLive()`
   *
   * @defaultValue
   * `false` outside draft mode. `true` inside draft mode when `defineLive()`
   * has a `serverToken` and the `client` defines `stega.studioUrl`, in both
   * export conditions.
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
}

/**
 * Like {@link DefinedFetchOptions} but with `stega` fixed to `true`, selecting
 * the overload that brands the returned `data` with stega string types.
 * All other options inherit their documentation from {@link DefinedFetchOptions}.
 */
interface DefinedFetchStegaEnabledOptions<
  QueryString extends string,
> extends DefinedFetchOptions<QueryString> {
  /**
   * Enables stega encoding of the data. This is typically only used in draft
   * mode with `perspective: 'drafts'` and `@sanity/visual-editing`.
   *
   * With the literal `true`, the returned `data` is stega-branded
   * (`StegaBranded<ClientReturn<...>>`): use `stegaClean` before comparing
   * strings against literals.
   *
   * @remarks
   * Requires `serverToken` to be configured in `defineLive()`
   */
  stega: true
}

/**
 * Like {@link DefinedFetchOptions} but with `stega` fixed to `false`, selecting
 * the overload that keeps the returned `data` free of stega branding.
 * All other options inherit their documentation from {@link DefinedFetchOptions}.
 */
interface DefinedFetchStegaDisabledOptions<
  QueryString extends string,
> extends DefinedFetchOptions<QueryString> {
  /**
   * Disables stega encoding for this fetch. The returned `data` keeps clean
   * TypeGen / {@link ClientReturn} types, no `stegaClean` needed.
   */
  stega: false
}

/**
 * Fetches data through the configured Sanity client and returns the result
 * together with the source map and cache tags that Sanity Live uses for
 * targeted revalidation. Returned by `defineLive()`.
 *
 * Overloads brand `data` with stega string types when stega may be enabled
 * (`stega: true`, a non-literal `boolean`, or omitted). Literal `stega: false`
 * keeps clean TypeGen / {@link ClientReturn} types.
 */
export type DefinedFetchType = {
  <const QueryString extends string>(
    options: DefinedFetchStegaEnabledOptions<QueryString>,
  ): DefinedFetchResult<FetchClientReturnStega<QueryString>>
  <const QueryString extends string>(
    options: DefinedFetchStegaDisabledOptions<QueryString>,
  ): DefinedFetchResult<ClientReturn<QueryString, unknown>>
  <const QueryString extends string>(
    options: DefinedFetchOptions<QueryString>,
  ): DefinedFetchResult<FetchClientReturnStega<QueryString>>
}

/**
 * Options accepted by `sanityFetchMetadata()`. Like {@link DefinedFetchOptions}
 * without `stega`, which is always `false` for metadata.
 */
type DefinedFetchMetadataOptions<QueryString extends string> = Omit<
  DefinedFetchOptions<QueryString>,
  'stega'
>

/**
 * Fetches data for `generateMetadata`, `generateViewport`, and the file-based
 * metadata routes (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, and so on).
 *
 * `stega` is always `false`, so `data` keeps clean TypeGen / {@link ClientReturn}
 * types. `perspective` follows the same default rule as `sanityFetch()`:
 * `'published'` outside draft mode, and inside draft mode the resolver, the
 * cookie, or `'drafts'` depending on the export condition. Presentation Tool
 * can open a standalone preview window, so `<title>` and friends should
 * reflect the previewed perspective too. Metadata routes such as `sitemap.ts`
 * cannot read root params, so pass `perspective: 'published'` there.
 */
export type DefinedFetchMetadataType = <const QueryString extends string>(
  options: DefinedFetchMetadataOptions<QueryString>,
) => DefinedFetchResult<ClientReturn<QueryString, unknown>>

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
   * `draftMode().isEnabled` when `defineLive()` has a `browserToken`, otherwise `false`.
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
   * Resolves the perspective for the current request when `sanityFetch()` is
   * called without an explicit `perspective` inside draft mode. Never called
   * outside draft mode. The returned string is sanitized, so a raw
   * `[perspective]` route segment is fine, and an invalid or missing value
   * falls back to `'drafts'`.
   *
   * Pass the `[perspective]` root param getter from `next/root-params` when a
   * `proxy.ts` rewrites every page into a `/[perspective]/...` tree. With a
   * resolver configured `sanityFetch()` never reads cookies, so it behaves the
   * same with `cacheComponents` on or off. Without one, the draft mode
   * perspective comes from the Presentation Tool cookie when `cacheComponents`
   * is off and is `'drafts'` when it is on.
   *
   * @example
   * ```ts
   * import {perspective} from 'next/root-params'
   *
   * export const {sanityFetch, SanityLive} = defineLive({client, serverToken, browserToken, perspective})
   * ```
   */
  perspective?: LivePerspectiveResolver
}

/**
 * Resolves the raw perspective for the current request, for example the
 * `[perspective]` root param getter exported by `next/root-params`.
 * Called by `sanityFetch()` only inside draft mode, so it never affects the
 * cache key of published content.
 */
export type LivePerspectiveResolver = () => string | undefined | Promise<string | undefined>

export interface SanityClientConfig extends Pick<
  InitializedClientConfig,
  'projectId' | 'dataset' | 'apiVersion' | 'token' | 'requestTagPrefix'
> {
  apiHost: string | undefined
  useProjectHostname: boolean | undefined
}

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
