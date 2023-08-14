import {createConditionalLiveQuery} from '@sanity/preview-kit/internals/create-conditional-live-query'

import ClientComponent from './LiveQueryClientComponent'

export type * from '@sanity/preview-kit/live-query'

/**
 * This is an experimental new API that might have breaking changes in minor versions.
 * @alpha */
export const LiveQuery = createConditionalLiveQuery({ClientComponent})
