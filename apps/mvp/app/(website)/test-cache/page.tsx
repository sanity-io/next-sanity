import {revalidateTag} from 'next/cache'
import {SystemStatus} from './SystemStatus'
import {sanityFetch} from '../live'

export default async function TestCachePage() {
  const {data} = await sanityFetch({query: `*[_type == 'post' && slug.current == "foobar"]`})

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
