import {CorsOriginError} from '@sanity/client'

/** @public */
export function isCorsOriginError(error: unknown): error is CorsOriginError {
  return error instanceof CorsOriginError
}

export type {CorsOriginError}
