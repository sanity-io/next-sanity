import {useRouter} from 'next/navigation.js'
import {useEffect} from 'react'

const focusThrottleInterval = 5_000

export default function RefreshOnFocus(): null {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    let nextFocusRevalidatedAt = 0
    const callback = () => {
      const now = Date.now()
      if (now > nextFocusRevalidatedAt && document.visibilityState !== 'hidden') {
        router.refresh()
        nextFocusRevalidatedAt = now + focusThrottleInterval
      }
    }
    const {signal} = controller
    document.addEventListener('visibilitychange', callback, {passive: true, signal})
    window.addEventListener('focus', callback, {passive: true, signal})
    return () => controller.abort()
  }, [router])

  return null
}
RefreshOnFocus.displayName = 'RefreshOnFocus'
