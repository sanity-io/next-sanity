/**
 * Some of the exports on index.ts causes errors on the edge runtime, so we omit them here.
 */

export * from './client'
export * from './create-data-attribute'
export * from './deprecated-live'
export * from '@portabletext/react'
export {defineQuery, default as groq} from 'groq'
import type {VisualEditingProps} from './visual-editing/VisualEditing'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'

/**
 * @deprecated import `VisualEditing` from `next-sanity/visual-editing` instead
 */
export function VisualEditing(_props: VisualEditingProps): React.ReactNode {
  throw new TypeError('VisualEditing is not supported on the edge runtime')
}
