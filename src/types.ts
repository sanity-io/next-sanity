import type {Config} from '@sanity/groq-store/dist/typings/types'

/** @public */
export type GroqStoreEventSource = Config['EventSource']

/** @public */
export interface ProjectConfig {
  projectId: string
  dataset: string
  token?: string
  /** Must be provided when token is used in browser, as native EventSource does not support auth-headers. */
  EventSource?: GroqStoreEventSource
}

/** @public */
export interface CurrentUser {
  id: string
  name: string
  profileImage?: string
}

/** @public */
export type Params = Record<string, unknown>

/** @public */
export interface SubscriptionOptions<R = any> {
  enabled?: boolean
  params?: Params
  initialData?: R
}
