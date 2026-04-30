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
  throw new Error(
    'defineLive does not yet support `cacheComponents: true`. Wait for the next major version of next-sanity, or use the prerelease with `pnpm install next-sanity@cache-components`',
  )
}

/**
 * @public
 */
export type {DefineSanityLiveOptions, DefinedSanityFetchType, DefinedSanityLiveProps}

export {isCorsOriginError} from '#live/isCorsOriginError'
