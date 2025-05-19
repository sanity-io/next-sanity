import {revalidateTag} from 'next/cache'
import {SystemStatus} from './SystemStatus'

export default function TestCachePage() {
  return (
    <>
      <button
        onClick={async () => {
          'use server'
          await revalidateTag('sanity:s1:57Y4Uw')
        }}
      >
        Test Cache
      </button>
      <br />
      <SystemStatus />
    </>
  )
}
