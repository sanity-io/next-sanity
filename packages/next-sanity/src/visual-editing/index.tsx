/* eslint-disable dot-notation */
import type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
import {lazy, Suspense} from 'react'

const VisualEditingComponent = lazy(() => import('next-sanity/visual-editing/client-component'))

/**
 * @public
 */
export function VisualEditing(props: VisualEditingProps): React.ReactElement {
  let autoBasePath: string | undefined
  if (typeof props.basePath !== 'string') {
    try {
      autoBasePath = process.env['__NEXT_ROUTER_BASEPATH']
      if (autoBasePath) {
        // eslint-disable-next-line no-console
        console.log(
          `Detected next basePath as ${JSON.stringify(autoBasePath)} by reading "process.env.__NEXT_ROUTER_BASEPATH". If this is incorrect then you can set it manually with the basePath prop on the <VisualEditing /> component.`,
        )
      }
    } catch (err) {
      console.error('Failed detecting basePath', err)
    }
  }
  let autoTrailingSlash: boolean | undefined
  if (typeof props.trailingSlash !== 'boolean') {
    try {
      autoTrailingSlash = Boolean(process.env['__NEXT_TRAILING_SLASH'])
      if (autoTrailingSlash) {
        // eslint-disable-next-line no-console
        console.log(
          `Detected next trailingSlash as ${JSON.stringify(autoTrailingSlash)} by reading "process.env.__NEXT_TRAILING_SLASH". If this is incorrect then you can set it manually with the trailingSlash prop on the <VisualEditing /> component.`,
        )
      }
    } catch (err) {
      console.error('Failed detecting trailingSlash', err)
    }
  }
  return (
    <Suspense fallback={null}>
      <VisualEditingComponent
        {...props}
        basePath={props.basePath ?? autoBasePath}
        trailingSlash={props.trailingSlash ?? autoTrailingSlash}
      />
    </Suspense>
  )
}

export {
  type CreateDataAttribute,
  createDataAttribute,
  type CreateDataAttributeProps,
} from '@sanity/visual-editing/create-data-attribute'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
