import {revalidateTag} from 'next/cache'

export default function TestCachePage() {
  return (
    <div>
      Test Cache
      <button
        onClick={async () => {
          await revalidateTag('foobar')
        }}
      >
        CLick me
      </button>
    </div>
  )
}
