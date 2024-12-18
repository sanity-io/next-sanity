import NextImage, {type ImageProps as NextImageProps} from 'next/image'

import {imageLoader} from './imageLoader'

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
   */
  src: string
}

/**
 * @alpha
 */
export function Image(props: ImageProps): React.JSX.Element {
  const {loader, src, ...rest} = props
  if (loader) {
    throw new TypeError(
      'The `loader` prop is not supported on `Image` components. Use `next/image` directly to use a custom loader.',
    )
  }
  let srcUrl: URL
  try {
    srcUrl = new URL(src)
    if (props.height) {
      srcUrl.searchParams.set('h', `${props.height}`)
    }
    if (props.width) {
      srcUrl.searchParams.set('w', `${props.width}`)
    }
  } catch (err) {
    throw new TypeError('The `src` prop must be a valid URL to an image on the Sanity Image CDN.', {
      cause: err,
    })
  }
  return <NextImage {...rest} src={srcUrl.toString()} loader={imageLoader} />
}
