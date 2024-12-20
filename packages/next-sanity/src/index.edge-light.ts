/**
 * Some of the exports on index.ts causes errors on the edge runtime, so we omit them here.
 */

import type {VisualEditingProps} from './visual-editing'

export * from './client'
export * from './create-data-attribute'
export * from '@portabletext/react'
export * from '@sanity/next-loader'
export {defineQuery, default as groq} from 'groq'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VisualEditing(_props: VisualEditingProps): React.ReactNode {
  throw new TypeError('VisualEditing is not supported on the edge runtime')
}
