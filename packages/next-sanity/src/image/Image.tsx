import {stegaClean} from '@sanity/client/stega'
import type {ImageUrlBuilder} from '@sanity/image-url'
import NextImage, {type ImageProps as NextImageProps} from 'next/image'

import {imageLoader} from './imageLoader'
import {resolveImageDimensions} from './resolveImageDimensions'
import {imageBuilderFor, isSanityAssetId, type ImageSource} from './resolveImageSource'

/**
 * @alpha
 */
export interface ImageProps extends Omit<NextImageProps, 'loader' | 'src'> {
  /**
   * The `loader` prop is not supported on `Image` components. Use `next/image` directly to use a custom loader.
   */
  loader?: never
  /**
   * The image to render. Either:
   * - a URL to an image on the Sanity Image CDN, e.g. from `asset->url` or an
   *   `@sanity/image-url` builder,
   * - an image object from a GROQ query (`{asset, crop, hotspot}`), applying
   *   the crop and hotspot set in the Studio,
   * - or a Sanity image asset id (`image-…`).
   *
   * Objects and asset ids need `projectId` and `dataset` to build the URL,
   * unless the asset URL is part of the object (e.g. `asset->{url}`).
   * Stega-encoded metadata from Content Source Maps is stripped automatically.
   */
  src: ImageSource
  /**
   * The Sanity project the image belongs to, used (together with `dataset`)
   * to build the URL when `src` is an image object or asset id. Falls back to
   * the project encoded in the asset URL when the query dereferences it.
   */
  projectId?: string
  /**
   * The Sanity dataset the image belongs to, see `projectId`.
   */
  dataset?: string
  /**
   * Additional [Sanity Image CDN params](https://www.sanity.io/docs/image-urls)
   * merged into the image URL, e.g. `{blur: 50, sat: -100}`. Sizing params
   * (`w`, `h`, `rect`) are ignored: they come from the `width`/`height` props,
   * the URL and the image object's crop and hotspot. `auto` and `fit` are
   * managed by the loader.
   */
  queryParams?: Record<string, string | number>
  /**
   * A ref to the underlying `<img>` element, forwarded through `next/image`.
   */
  ref?: React.ComponentProps<typeof NextImage>['ref']
}

const SIZING_PARAMS = new Set(['w', 'h', 'rect'])

function applyQueryParams(
  url: URL,
  queryParams: Record<string, string | number> | undefined,
): void {
  if (!queryParams) return
  for (const [key, value] of Object.entries(queryParams)) {
    if (SIZING_PARAMS.has(key)) continue
    url.searchParams.set(key, `${value}`)
  }
}

/**
 * Renders an image from the Sanity Image CDN with `next/image`.
 *
 * Unlike `next/image`, `width` and `height` are optional: when omitted they
 * are inferred, in order of precedence, from the URL's `w`/`h` params (e.g.
 * set by an `@sanity/image-url` builder), its `rect` crop param, or the
 * original dimensions Sanity encodes in every asset filename. Providing only
 * one dimension derives the other from the image's aspect ratio, like
 * `next/image` does for static imports.
 *
 * Image objects from GROQ queries are supported directly: the crop set in the
 * Studio is applied, the crop region is positioned around the hotspot when
 * the requested dimensions change the aspect ratio, and `placeholder="blur"`
 * uses `asset->metadata.lqip` when no `blurDataURL` is provided.
 *
 * @alpha
 */
export function Image(props: ImageProps): React.JSX.Element {
  const {loader, src, projectId, dataset, queryParams, blurDataURL, ...rest} = props
  if (loader) {
    throw new TypeError(
      'The `loader` prop is not supported on `Image` components. Use `next/image` directly to use a custom loader.',
    )
  }

  const source = typeof src === 'string' ? stegaClean(src) : src

  // data: and blob: URLs can't point to the Sanity Image CDN and don't support
  // transformation params: pass them through untouched and let `next/image`
  // render them unoptimized.
  if (typeof source === 'string' && (source.startsWith('data:') || source.startsWith('blob:'))) {
    return <NextImage {...rest} blurDataURL={blurDataURL} src={source} loader={imageLoader} />
  }

  let builder: ImageUrlBuilder | undefined
  let srcUrl: URL
  if (typeof source === 'string' && !isSanityAssetId(source)) {
    try {
      srcUrl = new URL(source)
    } catch (err) {
      throw new TypeError(
        'The `src` prop must be a valid URL to an image on the Sanity Image CDN.',
        {cause: err},
      )
    }
  } else {
    builder = imageBuilderFor(source, {projectId, dataset})
    srcUrl = new URL(builder.url())
  }
  applyQueryParams(srcUrl, queryParams)

  const {width, height} = resolveImageDimensions(srcUrl, props.width, props.height, props.fill)

  // Rebuild built URLs with the resolved dimensions, so the crop region is
  // positioned around the hotspot when the aspect ratio changes.
  const numericWidth = Number(width)
  const numericHeight = Number(height)
  if (builder && numericWidth > 0 && numericHeight > 0) {
    srcUrl = new URL(
      builder.width(Math.round(numericWidth)).height(Math.round(numericHeight)).url(),
    )
    applyQueryParams(srcUrl, queryParams)
  }

  // Encoding the resolved dimensions as CDN params lets the loader scale
  // both axes proportionally for every srcset candidate.
  if (height) {
    srcUrl.searchParams.set('h', `${height}`)
  }
  if (width) {
    srcUrl.searchParams.set('w', `${width}`)
  }

  // Use the low-quality image preview from the image object for blur
  // placeholders, unless an explicit blurDataURL is provided. `metadata` is
  // not part of the image-url source type; read it structurally so a query
  // that selects `asset->metadata.lqip` still feeds the placeholder.
  const lqip = lqipFrom(src)

  return (
    <NextImage
      {...rest}
      width={width}
      height={height}
      blurDataURL={blurDataURL ?? lqip}
      src={srcUrl.toString()}
      loader={imageLoader}
    />
  )
}

function lqipFrom(src: ImageSource): string | undefined {
  if (typeof src !== 'object' || src === null) return
  // An image object keeps its metadata on `asset`, an asset document keeps it on the root.
  const holder: unknown = 'asset' in src ? src.asset : src
  if (typeof holder !== 'object' || holder === null || !('metadata' in holder)) return
  const metadata = holder.metadata
  if (typeof metadata !== 'object' || metadata === null || !('lqip' in metadata)) return
  const lqip = metadata.lqip
  return typeof lqip === 'string' && lqip !== '' ? lqip : undefined
}
