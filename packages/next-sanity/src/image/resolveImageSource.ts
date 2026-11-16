import {stegaClean} from '@sanity/client/stega'
import {
  createImageUrlBuilder,
  isImageWithAsset,
  type ImageUrlBuilder,
  type SanityImageAssetLike,
  type SanityImageLike,
  type SanityImageSource,
  type SanityReference,
} from '@sanity/image-url'

/**
 * Image value accepted by `next-sanity/image`. Matches {@link SanityImageLike}
 * from `@sanity/image-url` (the shapes `sanity typegen` generates, including
 * an image whose asset has not been uploaded yet) and keeps the fields those
 * queries actually select: `alt`, a document `_id`, and `asset.metadata.lqip`.
 *
 * @alpha
 */
export interface SanityImageObject {
  /** Present when the value is an image document rather than a field. Ignored when `asset` is set. */
  _id?: string | null
  _type?: string
  _key?: string | null
  alt?: string | null
  media?: unknown
  asset?: {
    /** Set when the query returns the reference as-is, e.g. `asset` */
    _ref?: string | null
    /** Set when the query dereferences the asset, e.g. `asset->{_id}` */
    _id?: string | null
    _type?: string
    _weak?: boolean | null
    /** Set when the query dereferences the asset, e.g. `asset->{url}` */
    url?: string | null
    /** `asset->metadata.lqip`, used by `placeholder="blur"` */
    metadata?: {
      lqip?: string | null
    } | null
  } | null
  /** The crop set in the Studio, applied to the image URL as a `rect` param */
  crop?: {
    top?: number | null
    bottom?: number | null
    left?: number | null
    right?: number | null
    _type?: string
  } | null
  /**
   * The hotspot set in the Studio. When the requested dimensions change the
   * aspect ratio, the crop region is positioned around the hotspot.
   */
  hotspot?: {
    x?: number | null
    y?: number | null
    width?: number | null
    height?: number | null
    _type?: string
  } | null
}

/**
 * The `src` prop of the `Image` component: a Sanity Image CDN URL, a Sanity
 * image asset id (`image-…`), an asset reference (`{_ref}`) or asset document
 * (`{_id}`), or an image object from a GROQ query.
 *
 * `@sanity/image-url`'s `SanityAsset` type is not included: its index
 * signature would also accept a `next/image` static import.
 *
 * @alpha
 */
export type ImageSource =
  | string
  | SanityImageObject
  | SanityImageLike
  | SanityImageAssetLike
  | SanityReference

/**
 * Matches the pathname of Sanity Image CDN URLs:
 * `/images/{projectId}/{dataset}/{filename}`
 */
const ASSET_URL_PATH = /^\/images\/([^/]+)\/([^/]+)\//

const ASSET_ERROR = 'The `src` object must include an `asset` with a `_ref`, `_id`, or `url`.'

/**
 * Sanity image asset ids look like `image-{hash}-{width}x{height}-{format}`.
 */
export function isSanityAssetId(src: string): boolean {
  return src.startsWith('image-')
}

interface ParsedAssetUrl {
  projectId: string
  dataset: string
  baseUrl: string
}

function parseAssetUrl(assetUrl: string): ParsedAssetUrl | undefined {
  try {
    const url = new URL(assetUrl)
    const match = ASSET_URL_PATH.exec(url.pathname)
    if (match?.[1] && match[2]) {
      return {projectId: match[1], dataset: match[2], baseUrl: url.origin}
    }
  } catch {
    // Not a URL: fall through to the explicit props requirement
  }
  return undefined
}

/**
 * The project the image URL should be built for.
 *
 * @alpha
 */
export interface ImageProjectOptions {
  projectId?: string
  dataset?: string
}

/**
 * Configures an `@sanity/image-url` builder for an image object or asset id.
 * The project details come from the `projectId`/`dataset` options, falling
 * back to parsing them from the asset URL when the query dereferences it.
 * The asset URL's origin is kept (preserving custom CDN domains) whenever it
 * belongs to the resolved project and dataset.
 *
 * Crop and hotspot coordinates are passed through as queried. `@sanity/image-url`
 * fills in anything the projection left out: missing crop insets are `0`, and
 * a hotspot missing `width`/`height` (or `x`/`y`) uses that library's defaults.
 */
export function imageBuilderFor(
  source: ImageSource,
  {projectId, dataset}: ImageProjectOptions,
): ImageUrlBuilder {
  const prepared = prepareSource(source)
  const fromUrl = prepared.assetUrl ? parseAssetUrl(prepared.assetUrl) : undefined
  const resolvedProjectId = projectId ?? fromUrl?.projectId
  const resolvedDataset = dataset ?? fromUrl?.dataset
  if (!resolvedProjectId || !resolvedDataset) {
    throw new TypeError(
      'Unable to resolve the Sanity project id and dataset for the image. Pass the `projectId` and `dataset` props, or dereference the asset URL in the query (e.g. `asset->{url}`) so they can be read from it.',
    )
  }
  const sameProject =
    fromUrl?.projectId === resolvedProjectId && fromUrl.dataset === resolvedDataset
  return createImageUrlBuilder({
    projectId: resolvedProjectId,
    dataset: resolvedDataset,
    ...(sameProject ? {baseUrl: fromUrl.baseUrl} : {}),
  }).image(prepared.value)
}

interface PreparedSource {
  value: SanityImageSource
  assetUrl?: string
}

function prepareSource(source: ImageSource): PreparedSource {
  if (typeof source === 'string') {
    return {value: stegaClean(source)}
  }
  if (!isRecord(source)) {
    throw new TypeError(ASSET_ERROR)
  }

  // Image fields can carry the parent document's `_id`. `@sanity/image-url`
  // treats a top-level `_id` as an asset id, so rebuild the image from
  // `asset`/`crop`/`hotspot` only and let the library default the rest.
  if ('asset' in source || 'crop' in source || 'hotspot' in source) {
    const image = toImageLike(source)
    if (!isImageWithAsset(image)) {
      throw new TypeError(ASSET_ERROR)
    }
    return {value: image, assetUrl: urlOf(image.asset)}
  }

  const ref = stringField(source, '_ref')
  if (ref) {
    return {value: {_ref: stegaClean(ref)}}
  }

  const id = stringField(source, '_id')
  if (id) {
    const url = stringField(source, 'url')
    const cleanedUrl = url ? stegaClean(url) : undefined
    const asset: SanityImageAssetLike = cleanedUrl
      ? {_id: stegaClean(id), url: cleanedUrl}
      : {_id: stegaClean(id)}
    return {value: asset, assetUrl: cleanedUrl}
  }

  throw new TypeError(ASSET_ERROR)
}

function toImageLike(source: Record<string, unknown>): SanityImageLike {
  const image: SanityImageLike = {
    asset: 'asset' in source ? copyAsset(source['asset']) : undefined,
  }
  if ('crop' in source) image.crop = copyCrop(source['crop'])
  if ('hotspot' in source) image.hotspot = copyHotspot(source['hotspot'])
  return image
}

function copyAsset(asset: unknown): SanityImageLike['asset'] {
  if (!isRecord(asset)) return null
  const url = stringField(asset, 'url')
  const ref = stringField(asset, '_ref')
  const id = stringField(asset, '_id')
  const cleanedUrl = url ? stegaClean(url) : undefined
  const cleanedRef = ref ? stegaClean(ref) : undefined
  const cleanedId = id ? stegaClean(id) : undefined
  if (cleanedUrl && cleanedId) return {_id: cleanedId, url: cleanedUrl}
  if (cleanedUrl) return {url: cleanedUrl}
  if (cleanedRef) return {_ref: cleanedRef}
  if (cleanedId) return {_id: cleanedId}
  return null
}

function copyCrop(value: unknown): SanityImageLike['crop'] {
  if (value === null) return null
  if (!isRecord(value)) return undefined
  const crop: NonNullable<SanityImageLike['crop']> = {}
  const top = numberField(value, 'top')
  const bottom = numberField(value, 'bottom')
  const left = numberField(value, 'left')
  const right = numberField(value, 'right')
  if (top !== undefined) crop.top = top
  if (bottom !== undefined) crop.bottom = bottom
  if (left !== undefined) crop.left = left
  if (right !== undefined) crop.right = right
  return crop
}

function copyHotspot(value: unknown): SanityImageLike['hotspot'] {
  if (value === null) return null
  if (!isRecord(value)) return undefined
  const hotspot: NonNullable<SanityImageLike['hotspot']> = {}
  const x = numberField(value, 'x')
  const y = numberField(value, 'y')
  const width = numberField(value, 'width')
  const height = numberField(value, 'height')
  if (x !== undefined) hotspot.x = x
  if (y !== undefined) hotspot.y = y
  if (width !== undefined) hotspot.width = width
  if (height !== undefined) hotspot.height = height
  return hotspot
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key]
  return typeof value === 'number' ? value : undefined
}

function urlOf(asset: NonNullable<SanityImageLike['asset']>): string | undefined {
  if ('url' in asset && typeof asset.url === 'string') return asset.url
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
