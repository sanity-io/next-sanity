import type {QueryParams, SanityClient} from '@sanity/client'
import {GroqSyntaxError, parse} from 'groq-js'

/**
 * A single route param value. `string` for `[slug]`, `string[]` for `[...slug]` and `[[...slug]]`.
 * @public
 */
export type StaticParamValue = string | string[]

/**
 * The params object Next.js expects each `generateStaticParams` entry to be.
 * @public
 */
export type StaticParams = Record<string, StaticParamValue>

/**
 * The argument Next.js passes to `generateStaticParams` in a nested dynamic segment.
 * `params` holds the parent segment's params, for example `{category: 'sci-fi'}` for
 * `app/[category]/[slug]/page.tsx`.
 * @public
 */
export interface GenerateStaticParamsArgs {
  params?: StaticParams
}

/**
 * @public
 */
export interface DefineGenerateStaticParamsOptions<Shape extends StaticParams> {
  /**
   * The client used to fetch documents at build time. It is reconfigured with
   * `perspective: 'published'`, `useCdn: true`, and stega and source maps off, because
   * route params are never rendered and cookies are unavailable during `next build`.
   */
  client: SanityClient
  /**
   * GROQ filter placed inside `*[...]`. Parent segment params are available as GROQ
   * params, so `app/[category]/[slug]/page.tsx` can write
   * `'_type == "post" && category->slug.current == $category'`.
   */
  filter: string
  /**
   * One GROQ expression per route param, evaluated against each matching document.
   * The keys must match the keys of `fallback`; they become the param names.
   * @example
   * ```ts
   * {slug: 'slug.current'}
   * {category: 'category->slug.current', slug: 'slug.current'}
   * {path: 'string::split(slug.current, "/")'}
   * ```
   */
  params: {[Key in keyof NoInfer<Shape>]: string}
  /**
   * Returned as the only entry when the query yields no usable params, because
   * Cache Components fails `next build` when `generateStaticParams` returns `[]`.
   * Its shape also types the result. A `string` value declares a `[slug]` segment,
   * a `string[]` value declares a `[...slug]` or `[[...slug]]` segment.
   * Handle the placeholder in the page with `notFound()`.
   */
  fallback: Shape
  /**
   * Optional `order()` clause, for example `'_updatedAt desc'`.
   */
  order?: string
  /**
   * Optional cap on the number of documents, applied as `[0...limit]` after `order`.
   * Prerendering only the most relevant pages keeps `next build` fast; the rest render on demand.
   */
  limit?: number
}

/**
 * @public
 */
export interface DefinedGenerateStaticParams<Shape extends StaticParams> {
  /**
   * The assembled and syntax-checked GROQ query, for example
   * `*[_type == "post"] | order(_updatedAt desc) [0...100]{"slug": slug.current}`.
   * Useful for tests, or for fetching through `sanityFetch` when you want its cache tags.
   */
  query: string
  /**
   * Export this from the route file. Accepts the `{params}` argument Next.js passes to
   * nested segments and forwards those params to GROQ as `$name` variables.
   */
  generateStaticParams: (args?: GenerateStaticParamsArgs) => Promise<Shape[]>
}

/**
 * Returns `params` when it has at least one entry, otherwise `[fallback]`.
 *
 * Cache Components treats an empty `generateStaticParams` result as a build error, so a
 * dynamic route must always prerender at least one path. The placeholder path should
 * `notFound()` in the page.
 *
 * @example
 * ```ts
 * export async function generateStaticParams() {
 *   return ensureStaticParams(await getArticleStaticParams(), {article: '_', section: '_'})
 * }
 * ```
 * @public
 */
export function ensureStaticParams<T extends Record<string, null | string | string[]>>(
  params: null | T[] | undefined,
  fallback: NoInfer<T>,
): T[] {
  return params && params.length > 0 ? params : [fallback]
}

/**
 * Builds a `generateStaticParams` for a dynamic route from a GROQ filter and one GROQ
 * expression per route param.
 *
 * The query is assembled and parsed with `groq-js` when this function runs, which is at
 * module evaluation of the route file, so `next build` fails fast with the offending
 * expression and its position instead of a network error later in the build.
 * Documents are fetched from the published perspective. Rows whose param values are
 * `null` or of the wrong kind are dropped, duplicates are removed, and an empty result
 * becomes `[fallback]` via {@link ensureStaticParams}.
 *
 * @example
 * ```tsx
 * // app/posts/[slug]/page.tsx
 * import {defineGenerateStaticParams} from 'next-sanity/static-params'
 * import {notFound} from 'next/navigation'
 * import {client} from '@/sanity/client'
 *
 * export const {generateStaticParams} = defineGenerateStaticParams({
 *   client,
 *   filter: '_type == "post" && defined(slug.current)',
 *   params: {slug: 'slug.current'},
 *   fallback: {slug: '__placeholder__'},
 *   order: '_updatedAt desc',
 *   limit: 100,
 * })
 *
 * export default async function Page({params}: PageProps<'/posts/[slug]'>) {
 *   const {slug} = await params
 *   if (slug === '__placeholder__') notFound()
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // app/[category]/[slug]/page.tsx, the parent segment's params arrive as GROQ params
 * export const {generateStaticParams} = defineGenerateStaticParams({
 *   client,
 *   filter: '_type == "post" && category->slug.current == $category',
 *   params: {slug: 'slug.current'},
 *   fallback: {slug: '__placeholder__'},
 * })
 * ```
 *
 * @example
 * ```tsx
 * // app/docs/[...path]/page.tsx, a `string[]` fallback declares a catch-all segment
 * export const {generateStaticParams} = defineGenerateStaticParams({
 *   client,
 *   filter: '_type == "doc" && defined(slug.current)',
 *   params: {path: 'string::split(slug.current, "/")'},
 *   fallback: {path: ['__placeholder__']},
 * })
 * ```
 * @public
 */
export function defineGenerateStaticParams<Shape extends StaticParams>(
  options: DefineGenerateStaticParamsOptions<Shape>,
): DefinedGenerateStaticParams<Shape> {
  const {client, filter, params, fallback, order, limit} = options
  const query = assembleQuery({filter, params, order, limit})

  const staticClient = client.withConfig({
    perspective: 'published',
    useCdn: true,
    stega: false,
    resultSourceMap: false,
  })

  return {
    query,
    async generateStaticParams(args) {
      const queryParams: QueryParams = args?.params ?? {}
      const rows = await staticClient.fetch<unknown>(query, queryParams)
      return ensureStaticParams(pickStaticParams(rows, fallback), fallback)
    },
  }
}

interface QueryPieces {
  filter: string
  params: Record<string, string>
  order?: string | undefined
  limit?: number | undefined
}

function assembleQuery({filter, params, order, limit}: QueryPieces): string {
  assertGroq(filter, 'filter')
  const keys = Object.keys(params)
  if (keys.length === 0) {
    throw new TypeError('defineGenerateStaticParams: `params` must declare at least one route param')
  }
  for (const key of keys) {
    assertGroq(params[key]!, `params.${key}`)
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new TypeError(
      `defineGenerateStaticParams: \`limit\` must be a positive integer, got ${String(limit)}`,
    )
  }

  const projection = keys.map((key) => `${JSON.stringify(key)}: ${params[key]}`).join(', ')
  const pipe = order === undefined ? '' : ` | order(${order})`
  const slice = limit === undefined ? '' : `[0...${limit}]`
  const query = `*[${filter}]${pipe}${slice}{${projection}}`
  assertGroq(query, 'query')
  return query
}

function assertGroq(source: string, where: string): void {
  try {
    parse(source)
  } catch (error) {
    const position = error instanceof GroqSyntaxError ? ` at position ${error.position}` : ''
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `defineGenerateStaticParams: invalid GROQ in ${where}${position}\n  ${JSON.stringify(source)}\n  ${message}`,
      {cause: error},
    )
  }
}

function pickStaticParams<Shape extends StaticParams>(rows: unknown, fallback: Shape): Shape[] {
  if (!Array.isArray(rows)) {
    throw new TypeError(
      `defineGenerateStaticParams: expected the query to return an array, got ${typeof rows}`,
    )
  }
  const keys = Object.keys(fallback)
  const seen = new Set<string>()
  const result: Shape[] = []
  for (const row of rows) {
    const picked = pickRow(row, keys, fallback)
    if (picked === undefined) continue
    const identity = JSON.stringify(picked)
    if (seen.has(identity)) continue
    seen.add(identity)
    result.push(picked)
  }
  return result
}

function pickRow<Shape extends StaticParams>(
  row: unknown,
  keys: string[],
  fallback: Shape,
): Shape | undefined {
  if (!isRecord(row)) return undefined
  const picked: StaticParams = {}
  for (const key of keys) {
    const value = row[key]
    if (!matchesKind(value, fallback[key]!)) return undefined
    picked[key] = value
  }
  // Every key of `fallback` was checked against its declared kind, which is what `Shape` promises.
  // oxlint-disable-next-line no-unsafe-type-assertion
  return picked as Shape
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function matchesKind(value: unknown, sample: StaticParamValue): value is StaticParamValue {
  if (Array.isArray(sample)) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
  }
  return typeof value === 'string'
}
