import {prerender} from 'react-dom/static'

import {dataset, projectId, renderToString} from './helpers'

/**
 * Builds a Sanity Image CDN URL like the ones returned by GROQ (`asset->url`)
 * or `@sanity/image-url`. Tests should use a unique `fileName` whenever they
 * assert on warnings, since `next/image` deduplicates warnings by message and
 * the messages embed the src URL.
 */
export function sanityImageUrl(fileName: string, query = ''): string {
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${fileName}${query}`
}

/**
 * Decodes the HTML entities `react-dom` escapes in attribute values.
 */
function decodeEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

/**
 * Attributes of a rendered HTML tag, keyed by lowercased attribute name
 * (HTML attribute names are case-insensitive, and `react-dom` emits some of
 * them camelCased during server rendering, e.g. `srcSet` and `imageSrcSet`).
 * The attributes relevant to `<img>` and preload `<link>` tags are declared
 * explicitly so tests can use property access.
 */
export interface ParsedTag {
  alt?: string
  as?: string
  class?: string
  crossorigin?: string
  decoding?: string
  draggable?: string
  fetchpriority?: string
  height?: string
  id?: string
  imagesizes?: string
  imagesrcset?: string
  loading?: string
  referrerpolicy?: string
  rel?: string
  sizes?: string
  src?: string
  srcset?: string
  style?: string
  title?: string
  width?: string
  /** Any other rendered attribute, e.g. `data-*` */
  [attribute: string]: string | undefined
}

function parseTags(html: string, tagName: string): ParsedTag[] {
  const tags: ParsedTag[] = []
  const tagPattern = new RegExp(`<${tagName}\\b([^>]*?)/?>`, 'g')
  for (const [, rawAttributes = ''] of html.matchAll(tagPattern)) {
    const attributes: ParsedTag = {}
    for (const [, name = '', value = ''] of rawAttributes.matchAll(/([\w-]+)="([^"]*)"/g)) {
      attributes[name.toLowerCase()] = decodeEntities(value)
    }
    tags.push(attributes)
  }
  return tags
}

export interface RenderedImage {
  /** Attributes of the rendered `<img>` element. */
  img: ParsedTag
  /** Attributes of any `<link>` elements emitted alongside the image (e.g. preload hints). */
  links: ParsedTag[]
  /** The raw server-rendered HTML, for debugging and one-off assertions. */
  html: string
}

/**
 * Server-renders a single image element the same way Next.js does for Server
 * Components, and parses the resulting `<img>` (and any `<link>`) attributes.
 */
export async function renderImage(element: React.JSX.Element): Promise<RenderedImage> {
  const html = await renderToString(element)
  const [img, ...unexpected] = parseTags(html, 'img')
  if (!img) {
    throw new Error(`Expected the HTML to contain an <img> tag, got: ${html}`)
  }
  if (unexpected.length > 0) {
    throw new Error(`Expected the HTML to contain a single <img> tag, got: ${html}`)
  }
  return {img, links: parseTags(html, 'link'), html}
}

/**
 * Server-renders an element that is expected to throw, and returns the error.
 * Errors reported during prerendering are captured instead of being logged.
 */
export async function renderImageError(element: React.JSX.Element): Promise<unknown> {
  let reportedError: unknown
  try {
    await prerender(element, {
      onError(error) {
        reportedError ??= error
      },
    })
  } catch (error) {
    return reportedError ?? error
  }
  throw new Error('Expected rendering to fail, but it succeeded')
}

/**
 * The [Sanity Image CDN params](https://www.sanity.io/docs/image-urls) that
 * tests assert on, declared explicitly so tests can use property access.
 */
export interface SanityImageParams {
  auto?: string
  blur?: string
  fit?: string
  h?: string
  q?: string
  rect?: string
  sat?: string
  w?: string
  [param: string]: string | undefined
}

export interface SrcSetCandidate {
  url: string
  pathname: string
  descriptor: string
  params: SanityImageParams
}

/**
 * Parses a `srcset` attribute value into its candidates, with the search
 * params of each candidate URL expanded for easy assertions.
 */
export function parseSrcSet(srcSet: string | undefined): SrcSetCandidate[] {
  if (!srcSet) return []
  return srcSet.split(', ').map((candidate) => {
    const separator = candidate.lastIndexOf(' ')
    const url = candidate.slice(0, separator)
    const descriptor = candidate.slice(separator + 1)
    const {pathname, searchParams} = new URL(url)
    return {url, pathname, descriptor, params: Object.fromEntries(searchParams)}
  })
}

/**
 * Expands the search params of a URL for easy assertions.
 */
export function searchParamsOf(url: string | undefined): SanityImageParams {
  if (!url) throw new Error('Expected a URL, got undefined')
  return Object.fromEntries(new URL(url).searchParams)
}

/**
 * Parses an inline `style` attribute value into individual declarations,
 * ignoring `;` inside quoted strings and parentheses (e.g. `url("data:...")`).
 */
export function parseStyle(style: string | undefined): Record<string, string> {
  const declarations: Record<string, string> = {}
  if (!style) return declarations
  const parts: string[] = []
  let depth = 0
  let quote: '"' | "'" | null = null
  let current = ''
  for (const char of style) {
    if (quote) {
      if (char === quote) quote = null
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '(') {
      depth++
    } else if (char === ')') {
      depth--
    } else if (char === ';' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)
  for (const part of parts) {
    const separator = part.indexOf(':')
    if (separator === -1) continue
    declarations[part.slice(0, separator).trim()] = part.slice(separator + 1).trim()
  }
  return declarations
}
