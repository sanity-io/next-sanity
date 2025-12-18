import type {CorsOriginError} from '@sanity/client'

/** @public */
export function isCorsOriginError(error: unknown): error is CorsOriginError {
  return error instanceof Error && error.name === 'CorsOriginError'
}

export type {CorsOriginError}
