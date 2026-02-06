import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

export default function RefreshOnInterval(props: {interval: number}): null {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), props.interval)
    return () => clearInterval(interval)
  }, [router, props.interval])

  return null
}
RefreshOnInterval.displayName = 'RefreshOnInterval'
