import {draftMode} from 'next/headers'

import {sanitizePerspective} from '#live/sanitizePerspective'
import type {LivePerspective, LivePerspectiveResolver} from '#live/types'

export interface FetchOptionsInput {
  perspective?: LivePerspective
  variant?: string
  stega?: boolean
}

export interface ResolvedFetchOptions {
  perspective: LivePerspective
  variant: string | undefined
  stega: boolean
}

export interface DraftModeSource {
  perspective: () => Promise<LivePerspective>
  variant: () => Promise<string | undefined>
}

export function resolverSource(resolve: LivePerspectiveResolver | undefined): DraftModeSource {
  return {
    perspective: async () => sanitizePerspective(await resolve?.(), 'drafts'),
    variant: async () => undefined,
  }
}

export interface ResolveFetchOptionsConfig {
  serverToken: string | false | undefined
  studioUrlDefined: boolean
  draft: DraftModeSource
}

export async function resolveFetchOptions(
  input: FetchOptionsInput,
  {serverToken, studioUrlDefined, draft}: ResolveFetchOptionsConfig,
): Promise<ResolvedFetchOptions> {
  const canFetchDrafts = Boolean(serverToken)
  const wantsPerspective = canFetchDrafts && input.perspective === undefined
  const wantsStega = canFetchDrafts && studioUrlDefined && input.stega === undefined
  const isDraftMode = (wantsPerspective || wantsStega) && (await draftMode()).isEnabled

  return {
    perspective: input.perspective ?? (isDraftMode ? await draft.perspective() : 'published'),
    variant:
      input.variant ??
      (isDraftMode && input.perspective === undefined ? await draft.variant() : undefined),
    stega: input.stega ?? (isDraftMode && studioUrlDefined),
  }
}
