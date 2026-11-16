import {Image as SanityImage, type ImageProps} from 'next-sanity/image'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

/**
 * `next-sanity/image` bound to the demo project, the wrapper pattern the
 * README recommends: call sites can pass image objects from GROQ queries
 * without repeating `projectId`/`dataset`.
 */
export function Image(props: Omit<ImageProps, 'projectId' | 'dataset'>) {
  return <SanityImage projectId={projectId} dataset={dataset} {...props} />
}
