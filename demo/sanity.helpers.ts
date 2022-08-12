/* eslint-disable no-process-env */
import createImageUrlBuilder from '@sanity/image-url'

import {dataset, projectId} from './sanity.env'

type ImageUrlBuilder = ReturnType<typeof createImageUrlBuilder>
const imageBuilder = createImageUrlBuilder({projectId, dataset})
export const urlForImage = (source: Parameters<typeof imageBuilder.image>[0]): ImageUrlBuilder =>
  imageBuilder.image(source).auto('format').fit('max')
