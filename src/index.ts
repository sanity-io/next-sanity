import type {
  ClientConfig as ClientConfigForExport,
  SanityClient as SanityClientForExport,
} from '@sanity/client'
import type {Aborter as AborterForExport} from './aborter'

// Re-export to support --isolatedMode and other strict mode features
export type ClientConfig = ClientConfigForExport
export type SanityClient = SanityClientForExport
export type Aborter = AborterForExport

export * from './types'
export * from './client'
export {createCurrentUserHook} from './currentUser'
export {createPreviewSubscriptionHook} from './useSubscription'
export {default as groq} from 'groq'
