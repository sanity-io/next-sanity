import {type SanityClient, createClient as _createClient} from 'src'

import {apiVersion, dataset, projectId, useCdn} from './config'

export const createClient = (): SanityClient =>
  _createClient({projectId, dataset, apiVersion, useCdn})
