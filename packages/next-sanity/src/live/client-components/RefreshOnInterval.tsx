import {useRouter} from 'next/navigation'
import {startTransition, useEffect} from 'react'

export default function RefreshOnInterval(props: {interval: number}): null {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => startTransition(() => router.refresh()), props.interval)
    return () => clearInterval(interval)
  }, [router, props.interval])

  return null
}
RefreshOnInterval.displayName = 'RefreshOnInterval'
