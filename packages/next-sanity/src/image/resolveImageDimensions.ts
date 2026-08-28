type Dimension = number | `${number}`

interface ResolvedDimensions {
  width: Dimension | undefined
  height: Dimension | undefined
}

/**
 * Sanity encodes the original dimensions of every image asset into its
 * filename, e.g. `…/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg`. A documented
 * vanity filename may follow (`…/id-2000x3000.jpg/hero.jpg`).
 */
const FILENAME_DIMENSIONS = /-(\d+)x(\d+)\.\w+(?:\/|$)/

function parsePositiveInt(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * The intrinsic dimensions of the image a Sanity CDN URL points at: the
 * `rect` crop region when present (what the CDN will actually serve),
 * otherwise the original dimensions encoded in the asset filename.
 */
function intrinsicDimensionsOf(srcUrl: URL): {width: number; height: number} | undefined {
  const rect = srcUrl.searchParams.get('rect')?.split(',')
  if (rect?.length === 4) {
    const width = parsePositiveInt(rect[2])
    const height = parsePositiveInt(rect[3])
    if (width && height) return {width, height}
  }
  const filename = FILENAME_DIMENSIONS.exec(srcUrl.pathname)
  if (filename) {
    const width = parsePositiveInt(filename[1])
    const height = parsePositiveInt(filename[2])
    if (width && height) return {width, height}
  }
  return undefined
}

/**
 * Resolves the display dimensions for an image, in order of precedence:
 *
 * 1. The `width` and `height` props.
 * 2. The `w` and `h` params on the src URL (e.g. from an `@sanity/image-url`
 *    builder).
 * 3. Derived from the image's intrinsic aspect ratio, when only one dimension
 *    is known.
 * 4. The intrinsic dimensions: the `rect` crop region when present, otherwise
 *    the original dimensions Sanity encodes in the asset filename.
 *
 * `fill` images have no display dimensions, so resolution is skipped.
 */
export function resolveImageDimensions(
  srcUrl: URL,
  propWidth: Dimension | undefined,
  propHeight: Dimension | undefined,
  fill: boolean | undefined,
): ResolvedDimensions {
  if (fill) {
    return {width: propWidth, height: propHeight}
  }
  const width = propWidth ?? parsePositiveInt(srcUrl.searchParams.get('w'))
  const height = propHeight ?? parsePositiveInt(srcUrl.searchParams.get('h'))
  if (width !== undefined && height !== undefined) {
    return {width, height}
  }
  const intrinsic = intrinsicDimensionsOf(srcUrl)
  if (!intrinsic) {
    return {width, height}
  }
  if (width !== undefined) {
    return {width, height: Math.round((Number(width) / intrinsic.width) * intrinsic.height)}
  }
  if (height !== undefined) {
    return {width: Math.round((Number(height) / intrinsic.height) * intrinsic.width), height}
  }
  return intrinsic
}
