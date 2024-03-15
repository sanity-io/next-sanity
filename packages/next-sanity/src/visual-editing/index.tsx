import {lazy, Suspense} from 'react'

import type {VisualEditingProps} from './VisualEditing'

const VisualEditingComponent = lazy(() => import('./VisualEditing'))

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

export type {VisualEditingProps} from './VisualEditing'
export {
  type CreateDataAttribute,
  createDataAttribute,
  type CreateDataAttributeProps,
} from '@sanity/visual-editing'
