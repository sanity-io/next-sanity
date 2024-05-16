/* eslint-disable dot-notation */
import type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
import {lazy, Suspense} from 'react'

const VisualEditingComponent = lazy(() => import('next-sanity/visual-editing/client-component'))

/**
 * @public
 */
export function VisualEditing(
  props: VisualEditingProps & {
    /**
     * If next.config.ts is configured with a basePath we try to configure it automatically,
     * you can disable this by setting basePath to ''.
     * @example basePath="/my-custom-base-path"
     * @alpha experimental and may change without notice
     * @defaultValue process.env.__NEXT_ROUTER_BASEPATH || ''
     */
    basePath?: string
  },
): React.ReactElement {
  // detected basePath, its value, you can change it by setting the basePath prop on VisualEditing
  // or disable the auto mode by setting basePath to false

  let autoBasePath = ''
  try {
    autoBasePath = (process.env['__NEXT_ROUTER_BASEPATH'] as string) || ''
  } catch (err) {
    console.error('Failed detecting basePath', err)
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
