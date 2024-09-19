import {draftMode} from 'next/headers'
import {LiveQuery} from 'next-sanity/preview/live-query'

import PostsLayout, {query} from '@/app/PostsLayout'
import {PreviewPostsLayout} from '@/app/previews'

import {sanityFetch} from './live'

export default async function Posts() {
  const {data} = await sanityFetch({query})

  return (
    <LiveQuery
      enabled={draftMode().isEnabled}
      initialData={data}
      query={query}
      as={PreviewPostsLayout}
    >
      <PostsLayout data={data} draftMode={draftMode().isEnabled} />
    </LiveQuery>
  )
}
