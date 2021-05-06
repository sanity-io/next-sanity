import sanityClient from '@sanity/client'
import {ClientConfig} from './types'

export function createClient(config: ClientConfig) {
  return sanityClient(config)
}
