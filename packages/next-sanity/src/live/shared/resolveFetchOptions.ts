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

/**
 * Where `perspective` and `variant` come from inside draft mode when the
 * caller passed neither. Each getter is only called inside draft mode.
 */
export interface DraftModeSource {
  perspective: () => Promise<LivePerspective>
  variant: () => Promise<string | undefined>
}

/**
 * The draft mode source for `defineLive({perspective})`: the resolver names
 * the perspective, sanitized so a raw `[perspective]` route segment is fine,
 * and there is no variant. Also the source when no resolver is configured and
 * cookies cannot be read, where it falls back to `'drafts'`.
 */
export function resolverSource(resolve: LivePerspectiveResolver | undefined): DraftModeSource {
  return {
    perspective: async () => sanitizePerspective(await resolve?.(), 'drafts'),
    variant: async () => undefined,
  }
}

export interface ResolveFetchOptionsConfig {
  serverToken: string | false | undefined
  /**
   * `stega.studioUrl` on the client. Without it stega has nowhere to link, so
   * it never defaults on.
   */
  studioUrlDefined: boolean
  draft: DraftModeSource
}

/**
 * Draft mode decides the default of every option, and an explicit value wins
 * in either direction. Outside draft mode the defaults are `'published'`, no
 * variant, and no stega. Inside draft mode the perspective and variant come
 * from `draft`, and stega defaults on when the client can link to a Studio.
 *
 * Without a `serverToken` drafts cannot be fetched, so `draftMode()` is not
 * consulted at all. An explicit `perspective` also skips the variant source,
 * so a fetch with explicit options stays free of request-scoped reads.
 */
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
