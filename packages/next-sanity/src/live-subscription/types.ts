import type {ClientPerspective, QueryParams, SanityClient, SyncTag} from 'next-sanity'

/**
 * @alpha this API is experimental and may change or even be removed
 */
export interface LiveSubscriptionProps {
  projectId: string
  dataset: string
  apiHost: string
  apiVersion: string
  syncTags: SyncTag[]
  searchParamKey: string
}

/**
 * @alpha this API is experimental and may change or even be removed
 */
export type DefineSanityFetchFunction = <const SearchParamKey extends string>(
  options: DefineSanityFetchOptions<SearchParamKey>,
) => SanityFetchFunction<SearchParamKey>

/**
 * @alpha this API is experimental and may change or even be removed
 */
export interface DefineSanityFetchOptions<SearchParamKey extends string> {
  client: SanityClient
  searchParamKey: SearchParamKey
  draftMode?: {token?: string; stega?: boolean; perspective?: ClientPerspective}
}

/**
 * @alpha this API is experimental and may change or even be removed
 */
export type SanityFetchFunction<SearchParamKey extends string> = <QueryResponse>(
  options: SanityFetchOptions<SearchParamKey>,
) => Promise<[QueryResponse, LiveSubscription: () => JSX.Element | null]>

/**
 * @alpha this API is experimental and may change or even be removed
 */
export type SanityFetchOptions<SearchParamKey extends string> = Record<
  SearchParamKey,
  string | string[] | null | undefined
> & {
  query: string
  params?: QueryParams
  perspective?: ClientPerspective
  stega?: boolean
}
