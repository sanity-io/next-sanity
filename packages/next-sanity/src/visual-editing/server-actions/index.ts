'use server'

import type {ClientPerspective} from '@sanity/client'
import type {HistoryRefresh} from '@sanity/visual-editing/react'

import {sanitizePerspective} from '#live/sanitizePerspective'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {refresh} from 'next/cache'
import {cookies} from 'next/headers'

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function actionRefresh(_payload: HistoryRefresh): Promise<void> {
  refresh()
}

/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function actionPerspectiveChange(perspective: ClientPerspective): Promise<void> {
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
  if (nextPerspective === jar.get(perspectiveCookieName)?.value) {
    // oxlint-disable-next-line no-console
    console.debug('actionPerspectiveChange', 'Perspective is the same, skipping', nextPerspective)
    return
  }
  jar.set(perspectiveCookieName, nextPerspective, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'none',
  })

  refresh()
}
