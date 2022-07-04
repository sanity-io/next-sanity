import type {Config} from '@sanity/groq-store/dist/typings/types'

export type GroqStoreEventSource = Config['EventSource']

export interface ProjectConfig {
  projectId: string
  dataset: string
  token?: string
  /** Must be provided when token is used in browser, as native EventSource does not support auth-headers. */
  EventSource?: GroqStoreEventSource
}

export interface CurrentUser {
  id: string
  name: string
  profileImage?: string
}
