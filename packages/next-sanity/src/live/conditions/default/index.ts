import type {
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
} from '../react-server/defineLive'

/**
 * @public
 */
export function defineLive(_config: DefineSanityLiveOptions): {
  sanityFetch: DefinedSanityFetchType
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
} {
  throw new Error('defineLive can only be used in React Server Components')
}

/**
 * @public
 */
export type {DefineSanityLiveOptions, DefinedSanityFetchType, DefinedSanityLiveProps}

export {isCorsOriginError} from '#live/isCorsOriginError'
