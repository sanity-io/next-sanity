import {revalidateTag} from 'next/cache'

export default function TestCachePage() {
  return (
    <button
      onClick={async () => {
        'use server'
        await revalidateTag('sanity:s1:57Y4Uw')
      }}
    >
      Test Cache
    </button>
  )
}
