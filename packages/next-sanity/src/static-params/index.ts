import type {QueryParams, SanityClient} from '@sanity/client'
import {GroqSyntaxError, parse, unparse} from 'groq-js'

/**
 * A single route param value. `string` for `[slug]`, `string[]` for `[...slug]`.
 * @public
 */
export type StaticParamValue = string | string[]

/**
 * The params object Next.js expects each `generateStaticParams` entry to be.
 * @public
 */
export type StaticParams = Record<string, StaticParamValue>

/**
 * The value `generateStaticParams` returns for every param when the query yields no
 * documents. Cache Components fails `next build` on an empty result, so one path must
 * always prerender. Compare against it in the page and call `notFound()`.
 *
 * Next.js documents this placeholder at
 * https://nextjs.org/docs/messages/empty-generate-static-params and warns that it only
 * validates the `notFound()` path, so prefer a dataset that returns real documents.
 * @public
 */
export const STATIC_PARAMS_PLACEHOLDER = '__placeholder__'

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
   * The client that fetches documents at build time. The helper reconfigures it with
   * `perspective: 'published'`, `useCdn: true`, and stega and source maps off, because
   * route params are never rendered and cookies are unavailable during `next build`.
   */
  client: SanityClient
  /**
   * The page's own GROQ query. Every `<expression> == $param` conjunct in the root
   * `*[...]` filter names a route param and the expression that produces it. The other
   * conjuncts stay as constraints. Everything after the filter is dropped.
   * @example
   * ```ts
   * `*[_type == "post" && slug.current == $slug][0]{title, body}`
   * `*[_type == "post" && category->slug.current == $category && slug.current == $slug][0]`
   * `*[_type == "doc" && string::split(slug.current, "/") == $path][0]`
   * ```
   */
  query: string
  /**
   * Overrides the placeholder entry for some or all params. Required for a catch-all
   * segment, because the query cannot tell `[slug]` from `[...slug]`. A `string[]` value
   * declares `[...slug]` and drops rows that are not arrays of non-empty strings. Each
   * value must be a non-empty string or a non-empty array of non-empty strings, since
   * Next.js cannot route an empty segment.
   * @example
   * ```ts
   * {path: [STATIC_PARAMS_PLACEHOLDER]}
   * ```
   */
  fallback?: Partial<Shape>
  /**
   * Optional `order()` clause, for example `'_updatedAt desc'`.
   */
  order?: string
  /**
   * Optional cap on the number of documents, applied as `[0...limit]` after `order`.
   * Prerender only the first `limit` documents in `order` and let the rest render on demand.
   */
  limit?: number
}

/**
 * @public
 */
export interface DefinedGenerateStaticParams<Shape extends StaticParams> {
  /**
   * The GROQ query that runs when no parent params are given, for example
   * `*[_type == "post" && defined(slug.current)] | order(_updatedAt desc)[0...100]{"slug": slug.current}`.
   * groq-js prints the kept conjuncts, so `defined(x)` appears as `global::defined(x)`.
   * Useful for tests, or for fetching through `sanityFetch` when you want its cache tags.
   */
  query: string
  /**
   * Export this from the route file. Accepts the `{params}` argument Next.js passes to
   * nested segments. A param the parent already provides becomes a GROQ constraint and
   * is left out of the result. The remaining params are generated.
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
 * Builds a `generateStaticParams` for a dynamic route from the page's own GROQ query.
 *
 * The query is parsed with `groq-js` when the route module loads. Each
 * `<expression> == $param` conjunct in the root `*[...]` filter becomes a route param,
 * the other conjuncts stay as constraints, and the `[0]`, slices, ordering, and
 * projection after the filter are dropped. `*[_type == "post" && slug.current == $slug][0]{title}`
 * becomes `*[_type == "post" && defined(slug.current)]{"slug": slug.current}`. A syntax
 * error, a `$param` that is not bound with `==`, or a query without bindings fails
 * `next build` with the offending expression before any network request.
 *
 * The returned `generateStaticParams` fetches from the published perspective, drops rows
 * whose param values are `null`, empty, or of the wrong kind, removes duplicates, and
 * returns one {@link STATIC_PARAMS_PLACEHOLDER} entry when nothing remains, via
 * {@link ensureStaticParams}.
 *
 * @example
 * ```tsx
 * // app/posts/[slug]/page.tsx
 * import {defineQuery} from 'next-sanity'
 * import {defineGenerateStaticParams, STATIC_PARAMS_PLACEHOLDER} from 'next-sanity/static-params'
 * import {notFound} from 'next/navigation'
 * import {client} from '@/sanity/client'
 *
 * const postQuery = defineQuery(
 *   `*[_type == "post" && slug.current == $slug][0]{title, "slug": slug.current, publishedAt}`,
 * )
 * export const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
 *
 * export default async function Page({params}: PageProps<'/posts/[slug]'>) {
 *   const {slug} = await params
 *   if (slug === STATIC_PARAMS_PLACEHOLDER) notFound()
 *   const post = await client.fetch(postQuery, {slug})
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // app/[category]/[slug]/page.tsx receives {params: {category}} from the parent segment,
 * // so `$category` becomes a constraint and only `slug` is generated
 * const postQuery = defineQuery(
 *   `*[_type == "post" && category->slug.current == $category && slug.current == $slug][0]{title}`,
 * )
 * export const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
 * ```
 *
 * @example
 * ```tsx
 * // app/docs/[...path]/page.tsx, a `string[]` fallback declares the catch-all segment
 * const docQuery = defineQuery(`*[_type == "doc" && string::split(slug.current, "/") == $path][0]`)
 * export const {generateStaticParams} = defineGenerateStaticParams({
 *   client,
 *   query: docQuery,
 *   fallback: {path: [STATIC_PARAMS_PLACEHOLDER]},
 * })
 * ```
 * @public
 */
export function defineGenerateStaticParams<Shape extends StaticParams = Record<string, string>>(
  options: DefineGenerateStaticParamsOptions<Shape>,
): DefinedGenerateStaticParams<Shape> {
  const {client, query: pageQuery, order, limit} = options
  const fallback: Partial<StaticParams> = options.fallback ?? {}
  const plan = inferStaticParamsQuery(pageQuery)
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new TypeError(
      `defineGenerateStaticParams: \`limit\` must be a positive integer, got ${String(limit)}`,
    )
  }
  assertFallback(fallback, plan)
  const query = assembleQuery(plan, {}, order, limit)
  parseGroq(query, 'query')

  const staticClient = client.withConfig({
    perspective: 'published',
    useCdn: true,
    stega: false,
    resultSourceMap: false,
  })

  return {
    query,
    async generateStaticParams(args) {
      const parentParams = args?.params ?? {}
      const sample: StaticParams = {}
      const queryParams: QueryParams = {}
      for (const conjunct of plan) {
        if (conjunct.kind !== 'binding') continue
        if (Object.hasOwn(parentParams, conjunct.param)) {
          queryParams[conjunct.param] = parentParams[conjunct.param]
        } else {
          sample[conjunct.param] = fallback[conjunct.param] ?? STATIC_PARAMS_PLACEHOLDER
        }
      }
      if (Object.keys(sample).length === 0) {
        throw new Error(
          'defineGenerateStaticParams: the parent params already bind every $param, nothing is left to generate',
        )
      }
      const rows = await staticClient.fetch<unknown>(
        assembleQuery(plan, parentParams, order, limit),
        queryParams,
      )
      // oxlint-disable-next-line no-unsafe-type-assertion
      return ensureStaticParams(pickStaticParams(rows, sample), sample) as Shape[]
    },
  }
}

/**
 * One top-level `&&` conjunct of the page query's root filter, in source order.
 * A binding is `<expr> == $param`. Everything else is a constraint.
 */
type Conjunct = {kind: 'constraint'; groq: string} | {kind: 'binding'; param: string; expr: string}

/**
 * groq-js 2.0.0 ships no declarations for its AST nodes, so these name the few shapes
 * the walk inspects. Every other node only matters as an opaque subtree.
 */
interface GroqNode {
  type: string
  base?: GroqNode
}

interface FilterNode extends GroqNode {
  type: 'Filter'
  base: GroqNode
  expr: GroqNode
}

interface AndNode extends GroqNode {
  type: 'And'
  left: GroqNode
  right: GroqNode
}

interface GroupNode extends GroqNode {
  type: 'Group'
  base: GroqNode
}

interface OpCallNode extends GroqNode {
  type: 'OpCall'
  op: string
  left: GroqNode
  right: GroqNode
}

interface ParameterNode extends GroqNode {
  type: 'Parameter'
  name: string
}

function inferStaticParamsQuery(query: string): Conjunct[] {
  const root: GroqNode = parseGroq(query, 'query')
  const plan: Conjunct[] = []
  const boundBy = new Map<string, string>()
  for (const node of rootFilterExprs(root).flatMap((expr) => conjuncts(expr))) {
    const binding = asBinding(node)
    if (!binding) {
      if (containsParameter(node)) {
        throw new Error(
          `defineGenerateStaticParams: every $param in the root filter must be bound as \`<expression> == $param\` in a top-level &&, found ${unparse(node)}`,
        )
      }
      plan.push({kind: 'constraint', groq: unparse(node)})
      continue
    }
    const previous = boundBy.get(binding.param)
    if (previous !== undefined) {
      throw new Error(
        `defineGenerateStaticParams: \`$${binding.param}\` is bound twice, by ${previous} and ${binding.expr}`,
      )
    }
    boundBy.set(binding.param, binding.expr)
    plan.push({kind: 'binding', ...binding})
  }
  if (boundBy.size === 0) {
    throw new Error(
      'defineGenerateStaticParams: the query binds no $param, add a conjunct such as `slug.current == $slug`',
    )
  }
  return plan
}

/**
 * Walks down the `base` chain from the query root to the filter that sits on `*`, and
 * returns the `expr` of every filter in that chain, outermost last. `*[A][B]` reads as
 * `*[A && B]`. A filter that sits on anything else, such as `*[A]{...}[B]`, is rejected
 * because `B` would refer to the projected shape.
 */
function rootFilterExprs(root: GroqNode): GroqNode[] {
  let node: GroqNode | undefined = root
  while (node && !isFilter(node)) node = node.base
  const exprs: GroqNode[] = []
  while (node && isFilter(node)) {
    exprs.unshift(node.expr)
    node = node.base
  }
  if (node?.type === 'Everything') return exprs
  throw new Error('defineGenerateStaticParams: the query must start with `*[...]`')
}

function conjuncts(expr: GroqNode, out: GroqNode[] = []): GroqNode[] {
  if (isGroup(expr) && (isAnd(expr.base) || isOpCall(expr.base))) return conjuncts(expr.base, out)
  if (isAnd(expr)) {
    conjuncts(expr.left, out)
    conjuncts(expr.right, out)
    return out
  }
  out.push(expr)
  return out
}

function asBinding(node: GroqNode): {param: string; expr: string} | undefined {
  if (!isOpCall(node) || node.op !== '==') return undefined
  if (isParameter(node.left) && isParameter(node.right)) {
    throw new Error(
      `defineGenerateStaticParams: \`${unparse(node)}\` binds a param to another param`,
    )
  }
  const [param, expr] = isParameter(node.left)
    ? [node.left, node.right]
    : isParameter(node.right)
      ? [node.right, node.left]
      : []
  if (!param || !expr || containsParameter(expr)) return undefined
  return {param: param.name, expr: unparse(expr)}
}

function containsParameter(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(containsParameter)
  if (!isRecord(node)) return false
  if (node['type'] === 'Parameter') return true
  return Object.values(node).some(containsParameter)
}

function isFilter(node: GroqNode): node is FilterNode {
  return node.type === 'Filter'
}

function isAnd(node: GroqNode): node is AndNode {
  return node.type === 'And'
}

function isGroup(node: GroqNode): node is GroupNode {
  return node.type === 'Group'
}

function isOpCall(node: GroqNode): node is OpCallNode {
  return node.type === 'OpCall'
}

function isParameter(node: GroqNode): node is ParameterNode {
  return node.type === 'Parameter'
}

function assembleQuery(
  plan: Conjunct[],
  parentParams: StaticParams,
  order: string | undefined,
  limit: number | undefined,
): string {
  const filter: string[] = []
  const projection: string[] = []
  for (const conjunct of plan) {
    switch (conjunct.kind) {
      case 'constraint':
        filter.push(conjunct.groq)
        break
      case 'binding':
        if (Object.hasOwn(parentParams, conjunct.param)) {
          filter.push(`${conjunct.expr} == $${conjunct.param}`)
        } else {
          filter.push(`defined(${conjunct.expr})`)
          projection.push(`${JSON.stringify(conjunct.param)}: ${conjunct.expr}`)
        }
        break
      default:
        conjunct satisfies never
    }
  }
  const pipe = order === undefined ? '' : ` | order(${order})`
  const slice = limit === undefined ? '' : `[0...${limit}]`
  return `*[${filter.join(' && ')}]${pipe}${slice}{${projection.join(', ')}}`
}

function assertFallback(fallback: Partial<StaticParams>, plan: Conjunct[]): void {
  const bound = plan.flatMap((conjunct) => (conjunct.kind === 'binding' ? [conjunct.param] : []))
  for (const [key, value] of Object.entries(fallback)) {
    if (!bound.includes(key)) {
      throw new TypeError(
        `defineGenerateStaticParams: \`fallback.${key}\` does not match a $param, bound params: ${bound.join(', ')}`,
      )
    }
    if (!isRoutableValue(value, value)) {
      throw new TypeError(
        `defineGenerateStaticParams: \`fallback.${key}\` must be a non-empty string or a non-empty array of non-empty strings`,
      )
    }
  }
}

function parseGroq(source: string, where: string): GroqNode {
  try {
    const root: GroqNode = parse(source)
    return root
  } catch (error) {
    const position = error instanceof GroqSyntaxError ? ` at position ${error.position}` : ''
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `defineGenerateStaticParams: invalid GROQ in ${where}${position}\n  ${JSON.stringify(source)}\n  ${message}`,
      {cause: error},
    )
  }
}

function pickStaticParams(rows: unknown, sample: StaticParams): StaticParams[] {
  if (!Array.isArray(rows)) {
    throw new TypeError(
      `defineGenerateStaticParams: expected the query to return an array, got ${typeof rows}`,
    )
  }
  const seen = new Set<string>()
  const result: StaticParams[] = []
  for (const row of rows) {
    if (!isRecord(row)) continue
    const picked = pickKeys(row, sample)
    if (!hasShape(picked, sample)) continue
    const identity = JSON.stringify(picked)
    if (seen.has(identity)) continue
    seen.add(identity)
    result.push(picked)
  }
  return result
}

function pickKeys(row: Record<string, unknown>, sample: StaticParams): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const key of Object.keys(sample)) {
    picked[key] = row[key]
  }
  return picked
}

function hasShape(value: Record<string, unknown>, sample: StaticParams): value is StaticParams {
  return Object.keys(sample).every((key) => isRoutableValue(value[key], sample[key]))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}

/**
 * Next.js only checks that a `[...slug]` value is an array and a `[slug]` value is a
 * string, so `''` and `[]` pass its validation and would prerender an empty segment.
 */
function isRoutableValue(value: unknown, sample: unknown): value is StaticParamValue {
  if (Array.isArray(sample)) {
    return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
  }
  return isNonEmptyString(value)
}
