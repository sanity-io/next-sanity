/**
 * This file works around a new restriction in Next v15 where server components are not allowed
 * to use dynamic(() => import('...), {ssr: false})
 * only Client Components can set ssr: false.
 */

import dynamic from 'next/dynamic'

import type {VisualEditingProps} from './VisualEditing'

const VisualEditingClientComponent = dynamic(() => import('./VisualEditing'), {ssr: false})

export function VisualEditingLazyClientComponent(props: VisualEditingProps): React.ReactNode {
  return <VisualEditingClientComponent {...props} />
}
