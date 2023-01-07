import createImageUrlBuilder from '@sanity/image-url'
import {dataset, projectId} from 'app/config'

export const imageBuilder = createImageUrlBuilder({projectId, dataset})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const urlForImage = (source: Parameters<(typeof imageBuilder)['image']>[0]) =>
  imageBuilder.image(source).auto('format').fit('max')
