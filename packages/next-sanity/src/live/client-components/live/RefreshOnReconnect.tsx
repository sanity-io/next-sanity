import {useRouter} from 'next/navigation.js'
import {useEffect} from 'react'

export default function RefreshOnReconnect(): null {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    const {signal} = controller
    window.addEventListener('online', () => router.refresh(), {passive: true, signal})
    return () => controller.abort()
  }, [router])

  return null
}
RefreshOnReconnect.displayName = 'RefreshOnReconnect'
