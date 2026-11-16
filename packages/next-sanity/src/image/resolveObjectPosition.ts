import type {CSSProperties} from 'react'

import type {ImageSource} from './resolveImageSource'

/**
 * `fill` has no display box for the CDN to crop to, so the browser crops the
 * image (`object-fit: cover` in the usual markup). CSS then anchors that crop
 * at the center. When `src` is an image object with a hotspot, default
 * `object-position` to the hotspot so the subject stays in frame.
 *
 * Hotspot `x`/`y` are fractions of the original asset. The CDN serves the
 * Studio crop (`rect`), so the percentages are shifted into that cropped
 * image and clamped to it: a point outside the crop would otherwise push the
 * whole image out of the box. Missing coordinates use the same defaults as
 * `@sanity/image-url`: a hotspot axis falls back to `0.5`, a crop inset to `0`.
 *
 * `queryParams.flip` is applied by the CDN after that crop, so `h` / `v` /
 * `hv` mirror the clamped point. An explicit `style.objectPosition` or
 * `objectPosition` prop always wins. `style` is applied after the prop by
 * `next/image`, so when both are set the style value is the one that renders.
 */
export function resolveFillStyle(
  source: ImageSource,
  fill: boolean | undefined,
  style: CSSProperties | undefined,
  objectPosition: string | undefined,
  flip: string | number | undefined,
): CSSProperties | undefined {
  if (!fill || isExplicit(style?.objectPosition) || isExplicit(objectPosition)) {
    return style
  }
  const position = hotspotObjectPosition(source, flip)
  if (!position) return style
  return {...style, objectPosition: position}
}

function isExplicit(value: unknown): boolean {
  return value !== undefined && value !== null
}

function hotspotObjectPosition(
  source: ImageSource,
  flip: string | number | undefined,
): string | undefined {
  if (typeof source !== 'object' || source === null || !('hotspot' in source)) return
  const hotspot = source.hotspot
  if (!isRecord(hotspot)) return

  const crop = 'crop' in source && isRecord(source.crop) ? source.crop : undefined
  let x = clamp01(relativeToCrop(coordinate(hotspot, 'x', 0.5), crop, 'left', 'right'))
  let y = clamp01(relativeToCrop(coordinate(hotspot, 'y', 0.5), crop, 'top', 'bottom'))
  const axes = flipAxes(flip)
  if (axes.horizontal) x = 1 - x
  if (axes.vertical) y = 1 - y
  return `${formatPercent(x)} ${formatPercent(y)}`
}

/**
 * The CDN accepts `flip=h`, `flip=v`, and `flip=hv`, applied to the cropped
 * image. Anything else is left unmirrored: an unrecognized value is not a
 * flip the position can follow.
 */
function flipAxes(flip: string | number | undefined): {horizontal: boolean; vertical: boolean} {
  if (flip === 'h') return {horizontal: true, vertical: false}
  if (flip === 'v') return {horizontal: false, vertical: true}
  if (flip === 'hv') return {horizontal: true, vertical: true}
  return {horizontal: false, vertical: false}
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/**
 * Maps a point in the original image to the same point inside the cropped
 * region the CDN serves. A crop that consumes the whole axis can't be a
 * denominator, so the original fraction is used as-is.
 */
function relativeToCrop(
  value: number,
  crop: Record<string, unknown> | undefined,
  startKey: 'left' | 'top',
  endKey: 'right' | 'bottom',
): number {
  const start = coordinate(crop, startKey, 0)
  const end = coordinate(crop, endKey, 0)
  const size = 1 - start - end
  if (!(size > 0)) return value
  return (value - start) / size
}

function coordinate(
  record: Record<string, unknown> | undefined,
  key: string,
  fallback: number,
): number {
  const value = record?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function formatPercent(ratio: number): string {
  const percent = Math.round(ratio * 100000) / 1000
  return `${Object.is(percent, -0) ? 0 : percent}%`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
