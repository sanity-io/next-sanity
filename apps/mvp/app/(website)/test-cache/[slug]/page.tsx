import {revalidateTag} from 'next/cache'
import {SystemStatus} from '../SystemStatus'
import {sanityFetch} from '../../live'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const {data: posts} = await sanityFetch({
    query: `*[_type == 'post'] {
    "slug": slug.current
  }`,
    perspective: 'published',
    stega: false,
  })

  return posts.map((post) => ({slug: post.slug}))
}

export default async function TestCachePage(props: Props) {
  const {data} = await sanityFetch({
    query: `*[_type == 'post' && slug.current == $slug]`,
    params: props.params,
  })

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
