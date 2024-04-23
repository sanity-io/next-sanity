import type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
import {lazy, Suspense} from 'react'

const VisualEditingComponent = lazy(() => import('next-sanity/visual-editing/client-component'))

/**
 * @public
 */
export function VisualEditing(props: VisualEditingProps): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <VisualEditingComponent {...props} />
    </Suspense>
  )
}

export {
  type CreateDataAttribute,
  createDataAttribute,
  type CreateDataAttributeProps,
} from '@sanity/visual-editing/create-data-attribute'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
