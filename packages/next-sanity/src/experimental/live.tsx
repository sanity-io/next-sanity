import type {DefinedFetchType, DefinedLiveProps, LiveOptions, PerspectiveType} from '#live/types'

import {resolvePerspectiveFromCookies} from '#live/resolvePerspectiveFromCookies'
import SanityLiveClientComponent from 'next-sanity/experimental/client-components/live'
import {cacheTag, updateTag} from 'next/cache'
import {draftMode, cookies} from 'next/headers'
import {Suspense} from 'react'
import {preconnect} from 'react-dom'

import type {DefinedSanityFetchType, DefinedSanityLiveProps} from '../live/defineLive'

import {DRAFT_SYNC_TAG_PREFIX, PUBLISHED_SYNC_TAG_PREFIX} from './constants'

export function defineLive(config: LiveOptions): {
  fetch: DefinedFetchType
  Live: React.ComponentType<DefinedLiveProps>
  /**
   * @deprecated use `fetch` instead, and define your own `sanityFetch` function with logic for when to toggle `stega` and `perspective`
   */
  sanityFetch: DefinedSanityFetchType
  /**
   * @deprecated use `Live` instead, and define your own `SanityLive` component with logic for when to toggle `perspective`
   */
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
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
  const {token: originalToken} = client.config()

  const fetch: DefinedFetchType = async function fetch({
    query,
    params = {},
    perspective = 'published',
    stega = false,
    tags: customCacheTags = [],
    requestTag = 'next-loader.fetch.cache-components',
  }) {
    const useCdn = perspective === 'published'

    const {result, resultSourceMap, syncTags} = await client.fetch(query, params, {
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
     * Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
     */
    // cacheLife({revalidate: 60 * 60 * 24 * 90})

    return {data: result, sourceMap: resultSourceMap || null, tags}

    // return sanityCachedFetch(
    //   {
    //     apiHost,
    //     apiVersion,
    //     useProjectHostname,
    //     dataset,
    //     projectId,
    //     requestTagPrefix,
    //     token: originalToken,
    //   },
    //   {
    //     query,
    //     params,
    //     perspective,
    //     stega,
    //     requestTag,
    //     draftToken: serverToken,
    //     customCacheTags,
    //   },
    // ).then(({data, sourceMap, tags}) => ({
    //   data:
    //     stega && sourceMap
    //       ? stegaEncodeSourceMap(data, sourceMap, {...stegaConfig, enabled: true})
    //       : data,
    //   sourceMap,
    //   tags,
    // }))
  }

  const Live: React.ComponentType<DefinedLiveProps> = function Live(props) {
    const {
      perspective = 'published',
      onChange,
      onChangeIncludingDrafts,
      onStudioPerspective,
      refreshOnMount = false,
      refreshOnFocus = false,
      refreshOnReconnect = false,
      requestTag = 'next-loader.live.cache-components',
      onError,
      onGoAway,
      intervalOnGoAway,
    } = props

    
    if (onChangeIncludingDrafts) {
      console.warn('`onChangeIncludingDrafts` is not implemented yet')
    }
    if (onStudioPerspective) {
      console.warn('`onStudioPerspective` is not implemented yet')
    }

    const includeDrafts = typeof browserToken === 'string' && perspective !== 'published'

    const {projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix} =
      client.config()
    const {origin} = new URL(client.getUrl('', false))

    // Preconnect to the Live Event API origin early, as the Sanity API is almost always on a different origin than the app
    preconnect(origin)

    return (
      <Suspense>
        <SanityLiveClientComponent
          config={{
            projectId,
            dataset,
            apiHost,
            apiVersion,
            useProjectHostname,
            requestTagPrefix,
            token: includeDrafts ? browserToken : undefined,
          }}
          requestTag={requestTag}
          // origin={origin}
          draftModeEnabled={includeDrafts}
          refreshOnMount={refreshOnMount}
          refreshOnFocus={refreshOnFocus}
          refreshOnReconnect={refreshOnReconnect}
          onError={onError}
          onGoAway={onGoAway}
          intervalOnGoAway={intervalOnGoAway}
          revalidateSyncTags={onChange}
          resolveDraftModePerspective={resolveDraftModePerspective}
        />
      </Suspense>
    )
  }

  return {
    fetch,
    Live,
    sanityFetch: () => {
      throw new Error(
        '`defineLive().sanityFetch` is not available when `cacheComponents: true`, use `defineLive().fetch` instead',
      )
    },
    SanityLive: () => {
      throw new Error(
        '`defineLive().SanityLive` is not available when `cacheComponents: true`, use `defineLive().Live` instead',
      )
    },
  }
}



async function resolveDraftModePerspective(): Promise<PerspectiveType> {
  'use server'
  if ((await draftMode()).isEnabled) {
    const jar = await cookies()
    return resolvePerspectiveFromCookies({cookies: jar})
  }
  return 'published'
}

// revalidateSyncTags => actionUpdateTags
// router.refresh() => actionRefresh
