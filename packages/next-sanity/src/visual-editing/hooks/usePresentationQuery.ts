import type {ClientPerspective, ClientReturn, ContentSourceMap, QueryParams} from '@sanity/client'

/** @alpha */
export type UsePresentationQueryReturnsInactive = {
  data: null
  sourceMap: null
  perspective: null
}

/** @alpha */
export type UsePresentationQueryReturnsActive<QueryString extends string> = {
  data: ClientReturn<QueryString>
  sourceMap: ContentSourceMap | null
  perspective: ClientPerspective
}

export type UsePresentationQueryReturns<QueryString extends string> =
  | UsePresentationQueryReturnsInactive
  | UsePresentationQueryReturnsActive<QueryString>

const initialState: UsePresentationQueryReturnsInactive = {
  data: null,
  sourceMap: null,
  perspective: null,
}

/**
 * Experimental hook that can run queries in Presentation Tool.
 * Query results are sent back over postMessage whenever the query results change.
 * It also works with optimistic updates in the studio itself, offering low latency updates.
 * It's not as low latency as the `useOptimistic` hook, but it's a good compromise for some use cases.
 * Especially until `useOptimistic` propagates edits in the Studio parent window back into the iframe.
 * @alpha
 */
export function usePresentationQuery<const QueryString extends string>(_: {
  query: QueryString
  params?: QueryParams | Promise<QueryParams>
  stega?: boolean
}): UsePresentationQueryReturns<QueryString> {
  // oxlint-disable-next-line no-console
  console.log('TODO: Implement usePresentationQuery')

  return initialState
}
