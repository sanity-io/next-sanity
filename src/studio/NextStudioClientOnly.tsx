import {type ReactNode, startTransition, useEffect, useState} from 'react'

/** @alpha */
export type NextStudioClientOnlyProps = {
  children: ReactNode
  fallback: ReactNode
}

/** @alpha */
export function NextStudioClientOnly({children, fallback}: NextStudioClientOnlyProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => startTransition(() => setMounted(true)), [])

  return <>{mounted ? children : fallback}</>
}
