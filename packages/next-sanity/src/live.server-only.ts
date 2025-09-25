import type {
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
  DefinedSanityLiveStreamType,
} from './live/defineLive'

/**
 * @public
 */
export function defineLive(_config: DefineSanityLiveOptions): {
  sanityFetch: DefinedSanityFetchType
  SanityLive: React.ComponentType<DefinedSanityLiveProps>
  SanityLiveStream: DefinedSanityLiveStreamType
} {
  throw new Error('defineLive can only be used in React Server Components')
}

/**
 * @public
 */
export type {
  DefineSanityLiveOptions,
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
  DefinedSanityLiveStreamType,
}

// @TODO deprecate, so that we can simplify this branching and just use `import 'server-only'` instead
export {isCorsOriginError} from './isCorsOriginError'
