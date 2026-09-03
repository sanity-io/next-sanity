import {draftMode} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'
import {validateStrictFetchOptions} from '#live/strictValidation'
import type {LivePerspective, LivePerspectiveResolver} from '#live/types'

export interface StrictFetchInput {
  perspective?: LivePerspective
  variant?: string
  stega?: boolean
}

export interface ResolvedFetchOptions {
  perspective: LivePerspective
  variant: string | undefined
  stega: boolean
}

/**
 * The strict-mode contract: draft mode is the single source of truth.
 * Outside draft mode every fetch is the published fetch. Inside draft mode the
 * perspective comes from the caller or the configured resolver, and `stega`
 * defaults to on. Only `draftMode()` is read, which Next.js allows inside
 * `'use cache'` scopes, so callers never have to thread cookie values through.
 */
export async function resolveStrictFetchOptions(
  input: StrictFetchInput,
  resolvePerspective: LivePerspectiveResolver | undefined,
): Promise<ResolvedFetchOptions> {
  if (typeof input.perspective === 'undefined' && !resolvePerspective) {
    validateStrictFetchOptions(input)
  }

  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return {perspective: 'published', variant: undefined, stega: input.stega ?? false}
  }

  return {
    perspective: input.perspective ?? sanitizePerspective(await resolvePerspective?.(), 'drafts'),
    variant: input.variant,
    stega: input.stega ?? true,
  }
}
