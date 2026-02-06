import type {DefinedFetchType, DefinedLiveProps, DefineLiveOptions} from '#live/types'

import {DRAFT_SYNC_TAG_PREFIX, PUBLISHED_SYNC_TAG_PREFIX} from '#live/constants'
import {sanitizePerspective} from '#live/sanitizePerspective'
import {type ClientPerspective, type QueryParams} from '@sanity/client'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {SanityLive as SanityLiveClientComponent} from 'next-sanity/live/client-components'
import {actionRefresh, actionUpdateTags} from 'next-sanity/live/server-actions'
import {cookies, draftMode} from 'next/headers'
import {preconnect} from 'react-dom'

export function defineLive(config: DefineLiveOptions): {
  sanityFetch: DefinedFetchType
  SanityLive: React.ComponentType<DefinedLiveProps>
} {
  const {client: _client, serverToken, browserToken, stega: stegaEnabled = true} = config

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
  const {token: originalToken, perspective: originalPerspective = 'published'} = client.config()
  const studioUrlDefined = typeof client.config().stega.studioUrl !== 'undefined'

  const sanityFetch: DefinedFetchType = async function sanityFetch<
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
    const perspective =
      _perspective ??
      (await resolveCookiePerspective(
        originalPerspective === 'raw' ? 'published' : originalPerspective,
      ))
    const useCdn = perspective === 'published'
    const revalidate = false

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

    const cacheTags = [
      ...tags,
      ...(syncTags?.map(
        (tag) =>
          `${perspective === 'published' ? PUBLISHED_SYNC_TAG_PREFIX : DRAFT_SYNC_TAG_PREFIX}${tag}`,
      ) || []),
    ]

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
      onReconnect = actionRefresh,
      onRestart = actionRefresh,

      onWelcome = false,
      onError = false,
      onGoAway = false,

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
    sanityFetch,
    SanityLive,
  }
}

async function resolveCookiePerspective(
  fallback: Exclude<ClientPerspective, 'raw'>,
): Promise<Exclude<ClientPerspective, 'raw'>> {
  return (await draftMode()).isEnabled
    ? (await cookies()).has(perspectiveCookieName)
      ? sanitizePerspective((await cookies()).get(perspectiveCookieName)?.value, 'drafts')
      : 'drafts'
    : fallback
}
