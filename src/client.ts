import sanityClient from '@sanity/client'
import type {ClientConfig, SanityClient} from '@sanity/client'

export function createClient(config: ClientConfig): SanityClient {
  return sanityClient(config)
}
