/**
 *
 * If pages router supported `next/dynamic` imports (it wants `next/dynamic.js`),
 * or if turbopack in app router allowed `next/dynamic.js` (it doesn't yet)
 * we could use `dynamic(() => import('...), {ssr: false})` here.
 * Since we can't, we need to use a lazy import and Suspense ourself.
 */

import {lazy, Suspense} from 'react'

import type {NextStudioProps} from './NextStudio'

const NextStudioClientComponent = lazy(() => import('./NextStudio'))

export function NextStudioLazyClientComponent(props: NextStudioProps): React.ReactNode {
  return (
    <Suspense fallback={null}>
      <NextStudioClientComponent {...props} />
    </Suspense>
  )
}
