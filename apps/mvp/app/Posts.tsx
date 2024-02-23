import {draftMode} from 'next/headers'
import {LiveQuery} from 'next-sanity/preview/live-query'

import PostsLayout, {PostsLayoutProps, query} from '@/app/PostsLayout'
import {PreviewPostsLayout} from '@/app/previews'
import {sanityFetch} from '@/app/sanity.fetch'

export default async function Posts() {
  const posts = await sanityFetch<PostsLayoutProps['data']>({query, tags: ['post', 'author']})

  return (
    <LiveQuery
      enabled={draftMode().isEnabled}
      initialData={posts}
      query={query}
      as={PreviewPostsLayout}
    >
      <PostsLayout data={posts} draftMode={draftMode().isEnabled} />
    </LiveQuery>
  )
}
