import {
  createClient as createPreviewKitClient,
  type PreviewKitClientConfig,
} from '@sanity/preview-kit/client'

export type * from '@sanity/preview-kit/client'

/** @public */
export interface ClientConfig
  extends Omit<PreviewKitClientConfig, 'studioUrl' | 'encodeSourceMap'> {
  /**
   * Where the Studio is hosted.
   * If it's embedded in the app, use the base path for example `/studio`.
   * Otherwise provide the full URL to where the Studio is hosted, for example: `https://blog.sanity.studio`.
   * @defaultValue process.env.NEXT_PUBLIC_SANITY_STUDIO_URL
   * @alpha
   */
  studioUrl?: PreviewKitClientConfig['studioUrl']
  /**
   * If this is false then `@sanity/client` will be used. If set to 'auto' then it's enabled on Vercel Preview Deployments.
   * @defaultValue false
   * @alpha
   */
  encodeSourceMap?: PreviewKitClientConfig['encodeSourceMap']
}

/** @public */
export type SanityClient = ReturnType<typeof createPreviewKitClient>

/**
 * @public
 */
export function createClient(config: ClientConfig): SanityClient {
  let {
    // eslint-disable-next-line prefer-const, no-process-env
    studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL! as PreviewKitClientConfig['studioUrl'],
    encodeSourceMap = false,
  } = config
  // eslint-disable-next-line no-process-env
  if (encodeSourceMap === 'auto' && process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    encodeSourceMap = true
  }
  return createPreviewKitClient({...config, studioUrl, encodeSourceMap})
}
