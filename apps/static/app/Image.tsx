import {Image as SanityImage, type ImageProps} from 'next-sanity/image'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

/**
 * Binds the Sanity project to `next-sanity/image`, so call sites can pass
 * image objects from GROQ queries (`{asset, crop, hotspot}`) directly to
 * `src`. The `alt` text defaults to the `alt` field on the image object.
 */
export function Image(props: Omit<ImageProps, 'projectId' | 'dataset' | 'alt'> & {alt?: string}) {
  const {alt, src, ...rest} = props
  const cmsAlt =
    typeof src === 'object' && 'alt' in src && typeof src.alt === 'string' ? src.alt : undefined
  return (
    <SanityImage
      alt={alt ?? cmsAlt ?? ''}
      src={src}
      projectId={projectId}
      dataset={dataset}
      {...rest}
    />
  )
}
