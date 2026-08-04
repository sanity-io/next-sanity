import type {
  InferComponents as PortableTextInferComponents,
  InferStrictComponents as PortableTextInferStrictComponents,
  InferValue as PortableTextInferValue,
} from '@portabletext/react'
import type {StegaBranded, StegaCleaned} from '@sanity/client/stega'

/**
 * Widens a query result type to cover both sides of stega branding:
 * the clean TypeGen shape (`sanityFetch` with `stega: false`) and the
 * stega-branded shape (`sanityFetch` when stega may be enabled).
 *
 * This is what lets the `Infer*` types accept `data` from any `sanityFetch`
 * call without requiring a wholesale `stegaClean()`, which would strip the
 * hidden characters Visual Editing needs to make each paragraph clickable.
 */
type StegaAware<T> = StegaCleaned<T> | StegaBranded<T>

/**
 * Infer the Portable Text array value type from
 * {@link https://www.sanity.io/docs/apis-and-sdks/sanity-typegen | Sanity TypeGen}
 * generated types.
 *
 * Stega-aware version of `InferValue` from `@portabletext/react`: the inferred
 * value type accepts both clean query results (`sanityFetch` with
 * `stega: false`) and stega-branded results (`sanityFetch` when stega may be
 * enabled). Don't clean the value with `stegaClean()` before rendering it,
 * that strips the hidden characters `@sanity/visual-editing` uses to make each
 * paragraph clickable. Instead, use `stegaClean` on individual strings at the
 * point where they're compared against literals.
 *
 * Useful when building a re-usable wrapper component that only takes `value`
 * as an input prop and sets up `components` internally. Pass a TypeGen-
 * generated query result type that contains Portable Text fields - such as
 * an individual query result like `PostQueryResult`, or the `SanityQueries`
 * interface from `@sanity/client` - and `InferValue<T>` returns an array type
 * containing every Portable Text item shape it can find.
 *
 * Always feed `InferValue<T>` query result types, not Sanity schema types.
 * Schema types describe how content is stored, which can differ from how it
 * is queried (e.g. references resolved with `->`).
 *
 * @example
 * ```tsx
 * // Re-usable component typed against every registered query. Relies on
 * // `overloadClientMethods` being enabled in `sanity.cli.ts#typegen` (the default).
 * import {
 *   PortableText,
 *   type InferStrictComponents,
 *   type InferValue,
 *   type SanityQueries,
 * } from 'next-sanity'
 *
 * type PortableTextValue = InferValue<SanityQueries[keyof SanityQueries]>
 *
 * export function CustomPortableText(props: {value: PortableTextValue}) {
 *   const components = {
 *     types: {
 *       // custom types are autocompleted and fully typed
 *     },
 *   } satisfies InferStrictComponents<PortableTextValue>
 *
 *   return <PortableText components={components} value={props.value} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Rendering `sanityFetch` results, with or without stega, type-checks:
 * const {data} = await sanityFetch({query: postQuery, params})
 * return Array.isArray(data?.content) && <CustomPortableText value={data.content} />
 * ```
 */
export type InferValue<T> = PortableTextInferValue<StegaAware<T>>

/**
 * Infer Portable Text components from a value type. This matches the inference
 * behavior of the `components` prop on `<PortableText>`.
 *
 * Stega-aware version of `InferComponents` from `@portabletext/react`: the
 * inferred component props cover both clean query results (`sanityFetch` with
 * `stega: false`) and stega-branded results (`sanityFetch` when stega may be
 * enabled), so the same `components` object can render both. Strings that may
 * carry stega payloads stay branded inside component props: render them as-is
 * to keep Visual Editing working, and use `stegaClean` on the individual
 * values you compare against string literals.
 *
 * This is useful when working with
 * {@link https://www.sanity.io/docs/apis-and-sdks/sanity-typegen | Sanity TypeGen},
 * where `defineQuery()` and `sanityFetch()` can infer the shape of Portable
 * Text fields.
 *
 * @example
 * ```tsx
 * import {PortableText, type InferComponents, defineQuery} from 'next-sanity'
 * import {sanityFetch} from '@/sanity/lib/live'
 *
 * export default async function Page({slug}: {slug: string}) {
 *   const query = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title,content}`)
 *   const {data} = await sanityFetch({query, params: {slug}})
 *   const components = {
 *     block: {
 *       // custom types are autocompleted and fully typed
 *     },
 *   } satisfies InferComponents<typeof data.content>
 *
 *   return (
 *     <>
 *       ...
 *       {Array.isArray(data?.content) && <PortableText components={components} value={data.content} />}
 *     </>
 *   )
 * }
 * ```
 */
export type InferComponents<T> = PortableTextInferComponents<StegaAware<T>>

/**
 * Infer Portable Text components from a value type, requiring handlers for all
 * custom object types and disallowing extra custom object type handlers.
 *
 * Stega-aware version of `InferStrictComponents` from `@portabletext/react`,
 * see {@link InferComponents} for how stega branding is handled.
 *
 * This is used the same way as {@link InferComponents}, but serves a different
 * purpose: `InferComponents` is forgiving and mirrors the inline
 * `<PortableText components={...} />` experience, allowing custom handlers to
 * be omitted and allowing handlers for types that do not exist in, or could not
 * be inferred from, the value type. `InferStrictComponents` is strict: it
 * requires inferred custom handlers and rejects unknown ones.
 */
export type InferStrictComponents<T> = PortableTextInferStrictComponents<StegaAware<T>>
