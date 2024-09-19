/**
 * This file works around a new restriction in Next v15 where server components are not allowed
 * to use dynamic(() => import('...), {ssr: false})
 * only Client Components can set ssr: false.
 */

import dynamic from 'next/dynamic'

import type {NextStudioProps} from './NextStudio'

const NextStudioClientComponent = dynamic(() => import('./NextStudio'), {ssr: false})

export function NextStudioLazyClientComponent(props: NextStudioProps): React.ReactNode {
  return <NextStudioClientComponent {...props} />
}
