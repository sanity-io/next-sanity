import getImageUrlBuilder from '@sanity/image-url'
import {ProjectConfig} from './types'

export function createImageUrlBuilder({projectId, dataset}: ProjectConfig) {
  return getImageUrlBuilder({projectId, dataset})
}
