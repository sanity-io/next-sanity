import type {InitializedClientConfig} from '@sanity/client'

export interface SanityClientConfig
  extends Pick<
    InitializedClientConfig,
    | 'projectId'
    | 'dataset'
    | 'apiHost'
    | 'apiVersion'
    | 'useProjectHostname'
    | 'token'
    | 'requestTagPrefix'
  > {}
