import {createClient as _createClient, type SanityClient} from 'src'

import {apiVersion, dataset, projectId, useCdn} from './config'

export const createClient = (): SanityClient =>
  _createClient({projectId, dataset, apiVersion, useCdn, studioUrl: '/studio', logger: console})
