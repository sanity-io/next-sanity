import {type ReactNode, Suspense, useEffect, useReducer} from 'react'

/** @alpha */
export type NextStudioSuspenseProps = {
  children: ReactNode
  fallback: ReactNode
}

/** @alpha */
export function NextStudioSuspense({children, fallback}: NextStudioSuspenseProps) {
  const [mounted, mount] = useReducer(() => true, false)
  useEffect(mount, [mount])

  return <Suspense fallback={fallback}>{mounted ? children : fallback}</Suspense>
}
