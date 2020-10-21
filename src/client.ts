import picoSanity from 'picosanity'
import {ClientConfig} from './types'

export function createClient(config: ClientConfig) {
  return picoSanity(config)
}
