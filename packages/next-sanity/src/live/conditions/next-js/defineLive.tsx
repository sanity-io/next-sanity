import type {DefinedFetchType, DefinedLiveProps, DefineLiveOptions} from '#live/types'

import {DRAFT_SYNC_TAG_PREFIX, PUBLISHED_SYNC_TAG_PREFIX, revalidate} from '#live/constants'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {actionRefresh, actionUpdateTags} from 'next-sanity/live/server-actions'
import {cacheLife, cacheTag} from 'next/cache'
import {preconnect} from 'react-dom'

export function defineLive(config: DefineLiveOptions): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
} {
  const {client: _client, serverToken, browserToken} = config

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

  const client = _client.withConfig({allowReconfigure: false, useCdn: true})
  const {token: originalToken, perspective: originalPerspective = 'published'} = client.config()

  const fetch: DefinedFetchType = async function fetch({
    query,
    params = {},
    perspective = originalPerspective,
    stega = false,
    tags: customCacheTags = [],
    requestTag = 'next-loader.fetch.cache-components',
  }) {
    const useCdn = perspective === 'published'

    const {result, resultSourceMap, syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      returnQuery: false,
      perspective,
      useCdn,
      stega,
      cacheMode: useCdn ? 'noStale' : undefined,
      tag: requestTag,
      token: perspective === 'published' ? originalToken : serverToken || originalToken, // @TODO can pass undefined instead of config.token here?
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
    /**
     * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short,
     * userland can still set a shorter revalidate time by calling `cacheLife` themselves.
     */
    cacheLife({revalidate})

    return {data: result, sourceMap: resultSourceMap || null, tags}
  }

  const Live: React.ComponentType<DefinedLiveProps> = function Live(props) {
    const {
      includeAllDocuments = false,
      action = actionUpdateTags,
      restartAction = actionRefresh,
      reconnectAction = actionRefresh,
      goAwayAction,
      welcomeAction,
      refreshOnMount = false,
      refreshOnFocus = false,
      refreshOnReconnect = false,
      requestTag = 'next-loader.live.cache-components',
    } = props

    const shouldIncludeDrafts = typeof browserToken === 'string' && includeAllDocuments

    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()

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
          token: shouldIncludeDrafts ? browserToken : undefined,
        }}
        includeAllDocuments={shouldIncludeDrafts}
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
  Live.displayName = 'SanityLiveServerComponent'

  return {
    sanityFetch: fetch,
    SanityLive: Live,
  }
}
