import type {StegaBranded, StegaCleaned} from '@sanity/client/stega'
import type {
  InferImageValue as ImageUrlInferImageValue,
  InferStrictImageValue as ImageUrlInferStrictImageValue,
} from '@sanity/image-url'

/**
 * Widens a query result type to cover both sides of stega branding:
 * the clean TypeGen shape (`sanityFetch` with `stega: false`) and the
 * stega-branded shape (`sanityFetch` when stega may be enabled).
 */
type StegaAware<T> = StegaCleaned<T> | StegaBranded<T>

/**
 * Collects every image shape found anywhere in `T`, which can be a TypeGen
 * query result, a union of query results, or a schema type. File fields are
 * skipped. `null` and `undefined` are dropped.
 *
 * Stega-aware version of `InferImageValue` from `@sanity/image-url`: the
 * inferred image type accepts both clean query results and stega-branded
 * results. Don't `stegaClean()` the image before passing it to `<Image>`;
 * the component strips stega from the asset id and URL itself, and cleaning
 * the whole value would drop the characters Visual Editing needs elsewhere
 * on the page.
 *
 * @example
 * ```ts
 * import type {SanityQueries} from 'next-sanity'
 * import type {InferImageValue} from 'next-sanity/image'
 *
 * type ImageValue = InferImageValue<SanityQueries[keyof SanityQueries]>
 * ```
 *
 * @alpha
 */
export type InferImageValue<T> = ImageUrlInferImageValue<StegaAware<T>>

/**
 * Same as {@link InferImageValue}, but only the variants that have an asset,
 * which is what `isImageWithAsset` narrows to.
 *
 * Stega-aware version of `InferStrictImageValue` from `@sanity/image-url`.
 *
 * @alpha
 */
export type InferStrictImageValue<T> = ImageUrlInferStrictImageValue<StegaAware<T>>
