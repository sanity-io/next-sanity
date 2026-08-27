import {stegaClean} from '@sanity/client/stega'
import NextImage, {type ImageProps as NextImageProps} from 'next/image'

import {imageLoader} from './imageLoader'
import {resolveImageDimensions} from './resolveImageDimensions'

/**
 * @alpha
 */
export interface ImageProps extends Omit<NextImageProps, 'loader' | 'src'> {
  /**
   * The `loader` prop is not supported on `Image` components. Use `next/image` directly to use a custom loader.
   */
  loader?: never
  /**
   * Must be a string that is a valid URL to an image on the Sanity Image CDN.
   * Stega-encoded metadata from Content Source Maps is stripped automatically.
   */
  src: string
  /**
   * A ref to the underlying `<img>` element, forwarded through `next/image`.
   */
  ref?: React.ComponentProps<typeof NextImage>['ref']
}

/**
 * Renders an image from the Sanity Image CDN with `next/image`.
 *
 * Unlike `next/image`, `width` and `height` are optional: when omitted they
 * are inferred from the URL, in order of precedence, from its `w`/`h` params
 * (e.g. set by an `@sanity/image-url` builder), its `rect` crop param, or the
 * original dimensions Sanity encodes in every asset filename. Providing only
 * one dimension derives the other from the image's aspect ratio, like
 * `next/image` does for static imports.
 *
 * @alpha
 */
export function Image(props: ImageProps): React.JSX.Element {
  const {loader, src, ...rest} = props
  if (loader) {
    throw new TypeError(
      'The `loader` prop is not supported on `Image` components. Use `next/image` directly to use a custom loader.',
    )
  }
  const cleanSrc = stegaClean(src)
  // data: and blob: URLs can't point to the Sanity Image CDN and don't support
  // transformation params: pass them through untouched and let `next/image`
  // render them unoptimized.
  if (cleanSrc.startsWith('data:') || cleanSrc.startsWith('blob:')) {
    return <NextImage {...rest} src={cleanSrc} loader={imageLoader} />
  }
  let srcUrl: URL
  try {
    srcUrl = new URL(cleanSrc)
  } catch (err) {
    throw new TypeError('The `src` prop must be a valid URL to an image on the Sanity Image CDN.', {
      cause: err,
    })
  }
  const {width, height} = resolveImageDimensions(srcUrl, props.width, props.height, props.fill)
  // Encoding the resolved dimensions as CDN params lets the loader scale
  // both axes proportionally for every srcset candidate.
  if (height) {
    srcUrl.searchParams.set('h', `${height}`)
  }
  if (width) {
    srcUrl.searchParams.set('w', `${width}`)
  }
  return (
    <NextImage
      {...rest}
      width={width}
      height={height}
      src={srcUrl.toString()}
      loader={imageLoader}
    />
  )
}
