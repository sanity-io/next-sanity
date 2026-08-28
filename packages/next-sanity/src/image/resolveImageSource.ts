import {stegaClean} from '@sanity/client/stega'
import {createImageUrlBuilder, type ImageUrlBuilder} from '@sanity/image-url'

/**
 * The subset of a Sanity image field that `next-sanity/image` understands.
 * It matches what `sanity typegen` generates for image fields, so GROQ
 * results can be passed to the `src` prop directly. All members tolerate
 * `null`, and extra fields (like `_type` and `_key`) are ignored.
 *
 * @alpha
 */
export interface SanityImageObject {
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
  _type?: string
  _key?: string | null
  media?: unknown
}

/**
 * The `src` prop of the `Image` component: a Sanity Image CDN URL, a Sanity
 * image asset id (`image-…`), or an image object from a GROQ query.
 *
 * @alpha
 */
export type ImageSource = string | SanityImageObject

/**
 * Matches the pathname of Sanity Image CDN URLs:
 * `/images/{projectId}/{dataset}/{filename}`
 */
const ASSET_URL_PATH = /^\/images\/([^/]+)\/([^/]+)\//

/**
 * Sanity image asset ids look like `image-{hash}-{width}x{height}-{format}`.
 */
export function isSanityAssetId(src: string): boolean {
  return src.startsWith('image-')
}

function cleanString(value: string | null | undefined): string | undefined {
  return typeof value === 'string' ? stegaClean(value) : undefined
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
 * back to parsing them (and the base URL, preserving custom CDN domains) from
 * the asset URL when the query dereferences it.
 */
export function imageBuilderFor(
  source: string | SanityImageObject,
  {projectId, dataset}: ImageProjectOptions,
): ImageUrlBuilder {
  const normalized = normalizeSource(source)
  const fromUrl =
    typeof normalized === 'object' && normalized.asset.url
      ? parseAssetUrl(normalized.asset.url)
      : undefined
  const resolvedProjectId = projectId ?? fromUrl?.projectId
  const resolvedDataset = dataset ?? fromUrl?.dataset
  if (!resolvedProjectId || !resolvedDataset) {
    throw new TypeError(
      'Unable to resolve the Sanity project id and dataset for the image. Pass the `projectId` and `dataset` props, or dereference the asset URL in the query (e.g. `asset->{url}`) so they can be read from it.',
    )
  }
  return createImageUrlBuilder({
    projectId: resolvedProjectId,
    dataset: resolvedDataset,
    ...(projectId === undefined && dataset === undefined && fromUrl?.baseUrl
      ? {baseUrl: fromUrl.baseUrl}
      : {}),
  }).image(normalized)
}

function normalizeSource(source: string | SanityImageObject) {
  if (typeof source === 'string') {
    return stegaClean(source)
  }
  const id = cleanString(source.asset?._id) ?? cleanString(source.asset?._ref)
  const url = cleanString(source.asset?.url)
  if (!id && !url) {
    throw new TypeError('The `src` object must include an `asset` with a `_ref`, `_id`, or `url`.')
  }
  // Schema fields are optional, so `sanity typegen` marks every crop and
  // hotspot member as optional too: missing crop insets mean "not cropped on
  // that side", and a crop of all zeros is no crop at all.
  const crop = source.crop
    ? {
        top: source.crop.top ?? 0,
        bottom: source.crop.bottom ?? 0,
        left: source.crop.left ?? 0,
        right: source.crop.right ?? 0,
      }
    : undefined
  const hasCrop = crop && (crop.top || crop.bottom || crop.left || crop.right)
  // The hotspot width/height describe the size of the hotspot region.
  // `@sanity/image-url` requires them, but queries often select only
  // `hotspot {x, y}`: default to a zero-sized hotspot (a point) then.
  const hotspot =
    typeof source.hotspot?.x === 'number' && typeof source.hotspot.y === 'number'
      ? {
          x: source.hotspot.x,
          y: source.hotspot.y,
          width: source.hotspot.width ?? 0,
          height: source.hotspot.height ?? 0,
        }
      : undefined
  return {
    asset: {
      ...(id ? {_id: id} : {}),
      ...(url ? {url} : {}),
    },
    ...(hasCrop ? {crop} : {}),
    ...(hotspot ? {hotspot} : {}),
  }
}
