import {lazy, Suspense} from 'react'

import type {LiveSubscriptionProps} from './types'

const LiveSubscriptionClientComponent = lazy(
  () => import('next-sanity/live-subscription/client-component'),
)

/**
 * @alpha this API is experimental and may change or even be removed
 */
export function LiveSubscription(props: LiveSubscriptionProps): JSX.Element {
  return (
    <Suspense fallback={null}>
      <LiveSubscriptionClientComponent {...props} />
    </Suspense>
  )
}

export type {LiveSubscriptionProps} from './types'
