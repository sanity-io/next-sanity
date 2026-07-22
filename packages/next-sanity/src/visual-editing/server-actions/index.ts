'use server'

import type {ClientPerspective} from '@sanity/client'
import {perspectiveCookieName, variantCookieName} from '@sanity/preview-url-secret/constants'
import {refresh} from 'next/cache'
import {cookies} from 'next/headers'

import {partitionedCookieName} from '#live/constants'
import {sanitizePerspective} from '#live/sanitizePerspective'
import {sanitizeVariant} from '#live/sanitizeVariant'

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function perspectiveChangeAction(perspective: ClientPerspective): Promise<void> {
  const sanitizedPerspective = sanitizePerspective(perspective, 'drafts')
  if (
    !sanitizedPerspective ||
    (Array.isArray(sanitizedPerspective) && sanitizedPerspective.length === 0)
  ) {
    throw new Error(`Invalid perspective`, {cause: perspective})
  }

  const nextPerspective = Array.isArray(sanitizedPerspective)
    ? sanitizedPerspective.join(',')
    : sanitizedPerspective
  const jar = await cookies()
  if (
    nextPerspective === jar.get(perspectiveCookieName)?.value &&
    process.env.NODE_ENV !== 'production'
  ) {
    // oxlint-disable-next-line no-console
    console.debug('perspectiveChangeAction', 'Perspective is the same, skipping', nextPerspective)
    return
  }
  // Mirror the CHIPS partitioning decision from defineEnableDraftMode. Server
  // actions do not receive Sec-Fetch iframe headers, so we rely on the companion
  // flag cookie set during enable.
  // https://github.com/sanity-io/sanity/issues/12806
  jar.set(perspectiveCookieName, nextPerspective, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'none',
    partitioned: jar.has(partitionedCookieName),
  })

  refresh()
}

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function variantChangeAction(variant: string | undefined): Promise<void> {
  const sanitizedVariant = sanitizeVariant(variant)
  const jar = await cookies()
  const currentVariant = jar.get(variantCookieName)?.value

  // Unlike perspective, an empty/undefined variant is not an error: it means the
  // variant was cleared and any stale cookie must be removed.
  if (!sanitizedVariant) {
    if (!currentVariant) {
      return
    }
    jar.delete({
      name: variantCookieName,
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: jar.has(partitionedCookieName),
    })
    refresh()
    return
  }

  if (sanitizedVariant === currentVariant && process.env.NODE_ENV !== 'production') {
    // oxlint-disable-next-line no-console
    console.debug('variantChangeAction', 'Variant is the same, skipping', sanitizedVariant)
    return
  }
  // Mirror the CHIPS partitioning decision from defineEnableDraftMode. Server
  // actions do not receive Sec-Fetch iframe headers, so we rely on the companion
  // flag cookie set during enable.
  // https://github.com/sanity-io/sanity/issues/12806
  jar.set(variantCookieName, sanitizedVariant, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'none',
    partitioned: jar.has(partitionedCookieName),
  })

  refresh()
}
