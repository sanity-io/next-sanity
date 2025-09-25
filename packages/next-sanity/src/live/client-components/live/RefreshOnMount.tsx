/**
 * Handles refreshing the page when the page is mounted,
 * in case the content changes at a high enough frequency that by
 * the time the page started streaming, and the <SanityLive> component sets
 * up the EventSource connection, content might have changed.
 */

import {useRouter} from 'next/navigation.js'
import {useEffect, useReducer} from 'react'

export default function RefreshOnMount(): null {
  const router = useRouter()
  const [mounted, mount] = useReducer(() => true, false)

  useEffect(() => {
    if (!mounted) {
      mount()
      router.refresh()
    }
  }, [mounted, router])

  return null
}
RefreshOnMount.displayName = 'RefreshOnMount'
