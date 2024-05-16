/* eslint-disable dot-notation */
import type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
import {lazy, Suspense} from 'react'

const VisualEditingComponent = lazy(() => import('next-sanity/visual-editing/client-component'))

/**
 * @public
 */
export function VisualEditing(props: VisualEditingProps): React.ReactElement {
  // detected basePath, its value, you can change it by setting the basePath prop on VisualEditing
  // or disable the auto mode by setting basePath to false

  let autoBasePath: string | undefined
  if (typeof props.basePath !== 'string') {
    try {
      autoBasePath = process.env['__NEXT_ROUTER_BASEPATH']
      if (autoBasePath) {
        console.warn(
          `Detected next basePath as ${JSON.stringify(autoBasePath)} by reading "process.env.__NEXT_ROUTER_BASEPATH". If this is incorrect then you can set it manually with the basePath prop on the <VisualEditing /> component.`,
        )
      }
    } catch (err) {
      console.error('Failed detecting basePath', err)
    }
  }
  return (
    <Suspense fallback={null}>
      <VisualEditingComponent {...props} basePath={props.basePath ?? autoBasePath} />
    </Suspense>
  )
}

export {
  type CreateDataAttribute,
  createDataAttribute,
  type CreateDataAttributeProps,
} from '@sanity/visual-editing/create-data-attribute'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
