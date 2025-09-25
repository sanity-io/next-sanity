import {validateApiPerspective, type ClientPerspective} from '@sanity/client'

/** @internal */
export function sanitizePerspective(
  _perspective: unknown,
  fallback: 'drafts' | 'published',
): Exclude<ClientPerspective, 'raw'> {
  const perspective =
    typeof _perspective === 'string' && _perspective.includes(',')
      ? _perspective.split(',')
      : _perspective
  try {
    validateApiPerspective(perspective)
    return perspective === 'raw' ? fallback : perspective
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid perspective:`, _perspective, perspective, err)
    return fallback
  }
}
