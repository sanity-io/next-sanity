import {
  type VisualEditingProps,
  VisualEditing as VisualEditingComponent,
} from './visual-editing/VisualEditing'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'

let warned = false
/**
 * @deprecated import `VisualEditing` from `next-sanity/visual-editing` instead
 */
export function VisualEditing(props: VisualEditingProps): React.ReactNode {
  if (!warned) {
    console.warn(
      `Importing VisualEditing from the root import is deprecated and will be removed in next-sanity v11. Please change "import {VisualEditing} from 'next-sanity'" to "import {VisualEditing} from 'next-sanity/visual-editing'"`,
    )
    warned = true
  }
  return <VisualEditingComponent {...props} />
}
