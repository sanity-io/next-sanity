import {validateApiPerspective} from '@sanity/client'

import type {LivePerspective} from '#live/types'

// @TODO split into sanitizePerspective and parsePerspective, expose parsePerspective on the /live export
export function sanitizePerspective(
  _perspective: unknown,
  fallback: 'drafts' | 'published',
): LivePerspective {
  const perspective =
    typeof _perspective === 'string' && _perspective.includes(',')
      ? _perspective.split(',')
      : Array.isArray(_perspective)
        ? _perspective.filter(Boolean)
        : _perspective
  try {
    validateApiPerspective(perspective)
    return perspective === 'raw' ? fallback : perspective
  } catch (err) {
    console.warn(`Invalid perspective:`, _perspective, perspective, err)
    return fallback
  }
}
