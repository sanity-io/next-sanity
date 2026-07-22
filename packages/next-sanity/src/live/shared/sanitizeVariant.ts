/**
 * Editing variants are referenced by their bare variant id (e.g. `Ab12cd34`),
 * never the full variant document id (`_.variants.Ab12cd34`, rejected since
 * dots are not allowed). A single id, never comma-separated or an array.
 */
const VARIANT_ID_PATTERN = /^[A-Za-z0-9_-]+$/

/**
 * Unlike `sanitizePerspective` there is no fallback: an invalid or missing
 * variant means "no variant selected" and resolves to `undefined`.
 */
export function sanitizeVariant(_variant: unknown): string | undefined {
  if (typeof _variant !== 'string') {
    if (typeof _variant !== 'undefined' && _variant !== null) {
      console.warn(`Invalid variant:`, _variant)
    }
    return undefined
  }
  const variant = _variant.trim()
  if (variant === '') {
    return undefined
  }
  if (!VARIANT_ID_PATTERN.test(variant)) {
    console.warn(`Invalid variant:`, _variant)
    return undefined
  }
  return variant
}
