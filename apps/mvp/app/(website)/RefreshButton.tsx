'use client'

import {useRouter} from 'next/navigation'

export function RefreshButton() {
  const router = useRouter()
  return (
    <button
      className="bg-blue-500 text-white px-2 py-1 rounded font-medium"
      onClick={() => router.refresh()}
    >
      Refresh
    </button>
  )
}
