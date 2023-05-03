import {
  type ClientConfig as _ClientConfig,
  createClient as _createClient,
} from '@sanity/preview-kit/client'

export type * from '@sanity/preview-kit/client'

/** @public */
export interface ClientConfig extends Omit<_ClientConfig, 'studioUrl' | 'encodeSourceMap'> {
  /**
   * Where the Studio is hosted.
   * If it's embedded in the app, use the base path for example `/studio`.
   * Otherwise provide the full URL to where the Studio is hosted, for example: `https://blog.sanity.studio`.
   * @defaultValue process.env.NEXT_PUBLIC_SANITY_STUDIO_URL
   * @alpha
   */
  studioUrl?: _ClientConfig['studioUrl']
  /**
   * If there's no `studioUrl` then the default value is `none` and the normal `@sanity/client` will be used. If `studioUrl` is set, then it's `auto` by default.
   * @defaultValue process.env.MEXT_PUBLIC_SANITY_SOURCE_MAP || studioUrl ? 'auto' : 'none'
   * @alpha
   */
  encodeSourceMap?: _ClientConfig['encodeSourceMap']
}

/** @public */
export type SanityClient = ReturnType<typeof _createClient>

/**
 * @public
 */
export function createClient(config: ClientConfig): SanityClient {
  let {
    // eslint-disable-next-line prefer-const, no-process-env
    studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL! as _ClientConfig['studioUrl'],
    encodeSourceMap = (studioUrl ? 'auto' : false) satisfies _ClientConfig['encodeSourceMap'],
  } = config
  // eslint-disable-next-line no-process-env
  if (encodeSourceMap === 'auto' && process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    encodeSourceMap = true
  }
  return _createClient({...config, studioUrl, encodeSourceMap})
}
