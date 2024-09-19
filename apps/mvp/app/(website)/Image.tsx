import createImageUrlBuilder from '@sanity/image-url'
import {Image as SanityImage, type ImageProps} from 'next-sanity/image'

const imageBuilder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
})

export const urlForImage = (source: Parameters<(typeof imageBuilder)['image']>[0]) =>
  imageBuilder.image(source)

export function Image(
  props: Omit<ImageProps, 'src' | 'alt'> & {
    src: {
      _key?: string | null
      _type?: 'image' | string
      asset: {
        _type: 'reference'
        _ref: string
      }
      crop: {
        top: number
        bottom: number
        left: number
        right: number
      } | null
      hotspot: {
        x: number
        y: number
        height: number
        width: number
      } | null
      alt?: string | undefined
    }
    alt?: string
  },
) {
  const {src, ...rest} = props
  const imageBuilder = urlForImage(props.src)
  if (props.width) {
    imageBuilder.width(typeof props.width === 'string' ? parseInt(props.width, 10) : props.width)
  }
  if (props.height) {
    imageBuilder.height(
      typeof props.height === 'string' ? parseInt(props.height, 10) : props.height,
    )
  }

  return (
    <SanityImage
      alt={typeof src.alt === 'string' ? src.alt : ''}
      {...rest}
      src={imageBuilder.url()}
    />
  )
}
