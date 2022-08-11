import type {ClientConfig, SanityClient} from '@sanity/client'
import sanityClient from '@sanity/client'

export function createClient(config: ClientConfig): SanityClient {
  return sanityClient(config)
}
