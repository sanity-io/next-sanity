/* eslint-disable dot-notation */
import dynamic from 'next/dynamic'
import type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'

const VisualEditingComponent = dynamic(
  () => import('next-sanity/visual-editing/client-component'),
  {ssr: false},
)

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
    <VisualEditingComponent
      {...props}
      basePath={props.basePath ?? autoBasePath}
      trailingSlash={props.trailingSlash ?? autoTrailingSlash}
    />
  )
}

export {
  type CreateDataAttribute,
  createDataAttribute,
  type CreateDataAttributeProps,
} from '@sanity/visual-editing/create-data-attribute'
export type {VisualEditingProps} from 'next-sanity/visual-editing/client-component'
