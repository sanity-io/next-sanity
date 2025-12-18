import type {DefinedLiveProps} from '#live/types'

import {sanitizePerspective} from '#live/sanitizePerspective'
import {
  type ClientPerspective,
  type ClientReturn,
  type ContentSourceMap,
  type QueryParams,
  type SanityClient,
} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {actionRefresh, actionUpdateTags} from 'next-sanity/live/server-actions'
import {cookies, draftMode} from 'next/headers'
import {preconnect} from 'react-dom'

/**
 * @public
 */
export type DefinedSanityFetchType = <const QueryString extends string>(options: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  /**
   * Add custom `next.tags` to the underlying fetch request.
   * @see https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags
   * This can be used in conjunction with custom fallback revalidation strategies, as well as with custom Server Actions that mutate data and want to render with fresh data right away (faster than the Live Event latency).
   * @defaultValue `['sanity']`
   */
  tags?: string[]
  perspective?: Exclude<ClientPerspective, 'raw'>
  stega?: boolean
  /**
   * This request tag is used to identify the request when viewing request logs from your Sanity Content Lake.
   * @see https://www.sanity.io/docs/reference-api-request-tags
   * @defaultValue 'next-loader.fetch'
   */
  requestTag?: string
}) => Promise<{
  data: ClientReturn<QueryString>
  sourceMap: ContentSourceMap | null
  tags: string[]
}>

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
   * Fetch options used by `sanityFetch`
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

export function defineLive(config: DefineSanityLiveOptions): {
  /**
   * @deprecated use `fetch` instead, and define your own `sanityFetch` function with logic for when to toggle `stega` and `perspective`
   */
  sanityFetch: DefinedSanityFetchType
  /**
   * @deprecated use `Live` instead, and define your own `SanityLive` component with logic for when to toggle `perspective`
   */
  SanityLive: React.ComponentType<DefinedLiveProps>
  // fetch: DefinedFetchType
  // Live: React.ComponentType<DefinedLiveProps>
} {
  const {
    client: _client,
    serverToken,
    browserToken,
    fetchOptions,
    stega: stegaEnabled = true,
  } = config

  if (!_client) {
    throw new Error('`client` is required for `defineLive` to function')
  }

  if (process.env.NODE_ENV !== 'production' && !serverToken && serverToken !== false) {
    console.warn(
      'No `serverToken` provided to `defineLive`. This means that only published content will be fetched and respond to live events. You can silence this warning by setting `serverToken: false`.',
    )
  }

  if (process.env.NODE_ENV !== 'production' && !browserToken && browserToken !== false) {
    console.warn(
      'No `browserToken` provided to `defineLive`. This means that live previewing drafts will only work when using the Presentation Tool in your Sanity Studio. To support live previewing drafts stand-alone, provide a `browserToken`. It is shared with the browser so it should only have Viewer rights or lower. You can silence this warning by setting `browserToken: false`.',
    )
  }

  const client = _client.withConfig({allowReconfigure: false, useCdn: false})
  const {token: originalToken} = client.config()
  const studioUrlDefined = typeof client.config().stega.studioUrl !== 'undefined'

  const sanityFetch: DefinedSanityFetchType = async function sanityFetch<
    const QueryString extends string,
  >({
    query,
    params = {},
    stega: _stega,
    tags = ['sanity'],
    perspective: _perspective,
    tag,
    requestTag = tag ?? 'next-loader.fetch',
  }: {
    query: QueryString
    params?: QueryParams | Promise<QueryParams>
    stega?: boolean
    tags?: string[]
    perspective?: Exclude<ClientPerspective, 'raw'>
    tag?: string
    requestTag?: string
  }) {
    const stega = _stega ?? (stegaEnabled && studioUrlDefined && (await draftMode()).isEnabled)
    const perspective = _perspective ?? (await resolveCookiePerspective())
    const useCdn = perspective === 'published'
    const revalidate =
      fetchOptions?.revalidate !== undefined
        ? fetchOptions.revalidate
        : process.env.NODE_ENV === 'production'
          ? false
          : undefined

    // fetch the tags first, with revalidate to 1s to ensure we get the latest tags, eventually
    const {syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective: perspective as ClientPerspective,
      stega: false,
      returnQuery: false,
      next: {revalidate, tags: [...tags, 'sanity:fetch-sync-tags']},
      useCdn,
      cacheMode: useCdn ? 'noStale' : undefined,
      tag: [requestTag, 'fetch-sync-tags'].filter(Boolean).join('.'),
    })

    const cacheTags = [...tags, ...(syncTags?.map((tag) => `sanity:${tag}`) || [])]

    const {result, resultSourceMap} = await client.fetch(query, await params, {
      filterResponse: false,
      perspective: perspective as ClientPerspective,
      stega,
      token: perspective !== 'published' && serverToken ? serverToken : originalToken,
      next: {revalidate, tags: cacheTags},
      useCdn,
      cacheMode: useCdn ? 'noStale' : undefined,
      tag: requestTag,
    })
    return {data: result, sourceMap: resultSourceMap || null, tags: cacheTags}
  }

  const SanityLive: React.ComponentType<DefinedLiveProps> = async function SanityLive(props) {
    const {
      includeAllDocuments = (await draftMode()).isEnabled,
      action = actionUpdateTags,
      restartAction = actionRefresh,
      reconnectAction = actionRefresh,
      goAwayAction,
      welcomeAction,
      refreshOnMount,
      refreshOnFocus,
      refreshOnReconnect,
      requestTag = 'next-loader.live',
    } = props
    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()
    const shouldIncludeAllDocuments = typeof browserToken === 'string' && includeAllDocuments

    // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    const {origin} = new URL(client.getUrl('', false))
    preconnect(origin)

    return (
      <SanityLiveClientComponent
        config={{
          projectId,
          dataset,
          apiHost,
          apiVersion,
          useProjectHostname,
          requestTagPrefix,
          token: shouldIncludeAllDocuments ? browserToken : undefined,
        }}
        includeAllDocuments={shouldIncludeAllDocuments}
        action={action}
        reconnectAction={reconnectAction === false ? undefined : reconnectAction}
        restartAction={restartAction === false ? undefined : restartAction}
        welcomeAction={welcomeAction}
        goAwayAction={goAwayAction}
        requestTag={requestTag}
        refreshOnMount={refreshOnMount}
        refreshOnFocus={refreshOnFocus}
        refreshOnReconnect={refreshOnReconnect}
      />
    )
  }
  SanityLive.displayName = 'SanityLiveServerComponent'

  return {
    sanityFetch,
    SanityLive,
  }
}

async function resolveCookiePerspective(): Promise<Exclude<ClientPerspective, 'raw'>> {
  return (await draftMode()).isEnabled
    ? (await cookies()).has(perspectiveCookieName)
      ? sanitizePerspective((await cookies()).get(perspectiveCookieName)?.value, 'drafts')
      : 'drafts'
    : 'published'
}
