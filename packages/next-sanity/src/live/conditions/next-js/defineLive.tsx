import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {actionRefresh, actionUpdateTags} from 'next-sanity/live/server-actions'
import {cacheLife, cacheTag} from 'next/cache'
import {PHASE_PRODUCTION_BUILD} from 'next/constants'
import {preconnect} from 'react-dom'

import {cacheTagPrefixes, revalidate} from '#live/constants'
import {validateStrictFetchOptions, validateStrictSanityLiveProps} from '#live/strictValidation'
import type {
  DefinedFetchType,
  DefinedLiveProps,
  DefineLiveOptions,
  StrictDefinedFetchType,
  StrictDefinedLiveProps,
} from '#live/types'

export function defineLive(config: DefineLiveOptions & {strict: true}): {
  sanityFetch: StrictDefinedFetchType
  SanityLive: React.ComponentType<StrictDefinedLiveProps>
}
export function defineLive(config: DefineLiveOptions & {strict?: false}): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
}
export function defineLive(config: DefineLiveOptions) {
  const {client: _client, serverToken, browserToken, strict = false} = config

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

  const sanityFetch: DefinedFetchType = async function sanityFetch({
    query,
    params = {},
    perspective: _perspective,
    stega: _stega,
    tags: customCacheTags = [],
    requestTag = 'next-loader.fetch.cache-components',
  }) {
    if (strict) {
      validateStrictFetchOptions({perspective: _perspective, stega: _stega})
    }
    const perspective = _perspective ?? originalPerspective
    const stega = _stega ?? false
    const useCdn = perspective === 'published'
    const isBuildPhase = process.env['NEXT_PHASE'] === PHASE_PRODUCTION_BUILD
    const cacheMode = useCdn && !isBuildPhase ? 'noStale' : undefined

    const cacheTagPrefix =
      perspective === 'published' ? cacheTagPrefixes.published : cacheTagPrefixes.drafts
    const {result, resultSourceMap, syncTags} = await client.fetch(query, await params, {
      filterResponse: false,
      returnQuery: false,
      perspective,
      useCdn,
      stega,
      cacheMode,
      tag: requestTag,
      token: perspective === 'published' ? originalToken : serverToken || originalToken, // @TODO can pass undefined instead of config.token here?
    })
    const tags = [...customCacheTags, ...(syncTags || []).map((tag) => `${cacheTagPrefix}${tag}`)]
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

  const SanityLive: React.ComponentType<DefinedLiveProps> = function SanityLive(props) {
    if (strict) {
      validateStrictSanityLiveProps(props)
    }
    const {
      includeDrafts = false,
      action = actionUpdateTags,
      onReconnect = actionRefresh,
      onRestart = actionRefresh,

      onWelcome,
      onError,
      onGoAway,

      refreshOnMount = false,
      refreshOnFocus = false,
      refreshOnReconnect = false,
      requestTag = 'next-loader.live.cache-components',
    } = props

    const shouldIncludeDrafts = typeof browserToken === 'string' && includeDrafts

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
        includeDrafts={shouldIncludeDrafts}
        action={action}
        onReconnect={onReconnect}
        onRestart={onRestart}
        onWelcome={onWelcome}
        onError={onError}
        onGoAway={onGoAway}
        requestTag={requestTag}
        refreshOnMount={refreshOnMount}
        refreshOnFocus={refreshOnFocus}
        refreshOnReconnect={refreshOnReconnect}
      />
    )
  }
  SanityLive.displayName = 'SanityLiveServerComponent'

  return {
    sanityFetch: sanityFetch,
    SanityLive: SanityLive,
  }
}
