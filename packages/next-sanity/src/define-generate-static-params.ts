import type {SanityClient} from '@sanity/client'

declare global {
  /**
   * Registry for the types `sanity typegen` generates, read by {@link defineGenerateStaticParams}.
   * Empty by default. Register the `AllSanitySchemaTypes` union from your generated file:
   * ```ts
   * import type {AllSanitySchemaTypes} from './sanity.types'
   *
   * declare global {
   *   interface SanityTypegen {
   *     AllSanitySchemaTypes: AllSanitySchemaTypes
   *   }
   * }
   * ```
   */
  interface SanityTypegen {}
}

/**
 * The `_type` of every document in `SchemaTypes` that has a top-level `slug` field holding a slug
 * object. `SchemaTypes` is a union like TypeGen's `AllSanitySchemaTypes`.
 * @public
 */
export type SlugDocumentType<SchemaTypes> = SchemaTypes extends unknown
  ? 'slug' extends keyof SchemaTypes
    ? SchemaTypes extends {_id: string; _type: infer Type extends string; slug?: {current?: string}}
      ? Type
      : never
    : never
  : never

/**
 * The document types `defineGenerateStaticParams` accepts for `type`: the ones with a top-level
 * `slug` in the `AllSanitySchemaTypes` registered on `SanityTypegen`, or `string` when nothing is
 * registered. `Registry` only exists so the resolution can be tested.
 * @public
 */
export type GenerateStaticParamsType<Registry = SanityTypegen> = Registry extends {
  AllSanitySchemaTypes: infer SchemaTypes
}
  ? SlugDocumentType<SchemaTypes>
  : string

/**
 * @public
 */
export interface DefineGenerateStaticParamsOptions {
  client: SanityClient
  /**
   * The `_type` of the documents to generate params for.
   * With TypeGen types registered on `SanityTypegen` only document types that have a top-level
   * `slug` field are allowed.
   */
  type: GenerateStaticParamsType
}

/**
 * @public
 */
export interface GenerateStaticParams {
  generateStaticParams: () => Promise<Array<{slug: string}>>
}

const slugsByTypeQuery = '*[_type == $type && defined(slug.current)]{"slug": slug.current}'

/**
 * Defines `generateStaticParams` for a route with a `[slug]` segment, from the published documents
 * of one type that have a slug.
 *
 * When there are no documents it returns a placeholder slug, since Cache Components fails the build
 * on empty `generateStaticParams` results.
 *
 * @example
 * ```ts
 * // src/app/posts/[slug]/page.tsx
 *
 * import { defineGenerateStaticParams } from "next-sanity";
 * import { client } from "@/sanity/lib/client";
 *
 * export const { generateStaticParams } = defineGenerateStaticParams({ client, type: "post" });
 * ```
 *
 * @public
 */
export function defineGenerateStaticParams(
  options: DefineGenerateStaticParamsOptions,
): GenerateStaticParams {
  const {client, type} = options
  return {
    generateStaticParams: async () => {
      const data = await client.fetch<Array<{slug: string}>>(
        slugsByTypeQuery,
        {type},
        {perspective: 'published', stega: false},
      )
      if (data.length > 0) {
        return data
      }
      return [{slug: '__placeholder__'}]
    },
  }
}
