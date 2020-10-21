import picoSanity from 'picosanity/legacy'
import {ClientConfig} from './types'

export function createClient(config: ClientConfig) {
  return picoSanity(config)
}
