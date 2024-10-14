import {draftMode} from 'next/headers'
import {LiveQuery} from 'next-sanity/preview/live-query'

import PostsLayout, {PostsLayoutProps, query} from './PostsLayout'
import PreviewPosts from './PreviewPosts'
import {sanityFetch} from './sanity.fetch'

export default async function Posts() {
  const posts = await sanityFetch<PostsLayoutProps['data']>({query, tags: ['post', 'author']})

  if ((await draftMode()).isEnabled) {
    return <PreviewPosts data={posts} />
  }

  return <PostsLayout data={posts} draftMode={false} />
}
