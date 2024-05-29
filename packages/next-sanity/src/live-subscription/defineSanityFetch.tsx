import {draftMode} from 'next/headers.js'

import {LiveSubscription as LiveSubscriptionComponent} from './LiveSubscription'
import type {
  DefineSanityFetchFunction,
  DefineSanityFetchOptions,
  SanityFetchFunction,
  SanityFetchOptions,
} from './types'

/**
 * @alpha this API is experimental and may change or even be removed
 */
export const defineSanityFetch: DefineSanityFetchFunction = function <
  const SearchParamKey extends string,
>({
  client,
  draftMode: draftModeOptions,
  searchParamKey,
}: DefineSanityFetchOptions<SearchParamKey>) {
  const sanityFetch: SanityFetchFunction<SearchParamKey> = async function <QueryResponse>(
    options: SanityFetchOptions<SearchParamKey>,
  ): Promise<[QueryResponse, LiveSubscription: () => JSX.Element | null]> {
    const {query, params = {}} = options
    let {perspective, token} = client.config()
    let stega = client.config().stega.enabled

    if (!(searchParamKey in options)) {
      throw new Error(
        `The search param key "${searchParamKey}" is required, if you don't have a value for it use "sanityFetch({query, params, ['${searchParamKey}']: undefined})".`,
      )
    }
    const lastLiveEventId = options[searchParamKey]

    if (draftModeOptions && Object.keys(draftModeOptions).length > 0 && draftMode().isEnabled) {
      if (draftModeOptions.token) {
        token = draftModeOptions.token
      }
      if (draftModeOptions.stega) {
        stega = draftModeOptions.stega
      }
      if (draftModeOptions.perspective) {
        perspective = draftModeOptions.perspective
      }
    }

    const {result, syncTags} = await client.fetch<QueryResponse>(query, params, {
      perspective: options.perspective ?? perspective,
      stega: options.stega ?? stega,
      token,
      cache: 'no-cache',
      filterResponse: false,
      lastLiveEventId,
    })

    const LiveSubscription = () => {
      const {projectId, dataset, apiHost, apiVersion} = client.config()
      if (!projectId) {
        throw new TypeError('The `projectId` is required.')
      }
      if (!dataset) {
        throw new TypeError('The `dataset` is required.')
      }
      if (!apiHost) {
        throw new TypeError('The `apiHost` is required.')
      }
      if (!apiVersion) {
        throw new TypeError('The `apiVersion` is required.')
      }
      if (!Array.isArray(syncTags) && apiHost !== 'X') {
        throw new TypeError(
          'The `apiVersion` must be `vX` in order for the `syncTags` to be available on the response.',
        )
      }
      if (!Array.isArray(syncTags)) {
        console.error(
          'There are no `syncTags`, so the LiveSubscription component will not be rendered.',
        )
        return null
      }

      return (
        <LiveSubscriptionComponent
          projectId={projectId}
          dataset={dataset}
          apiHost={apiHost}
          apiVersion={apiVersion}
          searchParamKey={searchParamKey}
          syncTags={syncTags}
        />
      )
    }

    return [result, LiveSubscription]
  }

  return sanityFetch
}

export type {
  DefineSanityFetchFunction,
  DefineSanityFetchOptions,
  SanityFetchFunction,
  SanityFetchOptions,
} from './types'
