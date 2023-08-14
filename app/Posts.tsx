import {PostsLayout, PostsLayoutProps, query} from 'app/PostsLayout'
import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'

import {sanityFetch} from './sanity.fetch'

const PreviewPosts = dynamic(() => import('./PreviewPosts'))

export default async function Posts() {
  const posts = await sanityFetch<PostsLayoutProps['data']>({query, tags: ['post', 'author']})

  return draftMode().isEnabled ? (
    <PreviewPosts data={posts} draftMode={draftMode().isEnabled} />
  ) : (
    <PostsLayout data={posts} draftMode={draftMode().isEnabled} />
  )
}
