import PostsLayout, {PostsLayoutProps, query} from 'app/PostsLayout'
import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'
import {LiveQuery} from 'src/preview/LiveQuery/LiveQuery'

import {getDraftModeToken} from './getDraftModeToken'
// import {PreviewWrapper} from 'src/preview/LiveQuery/PreviewWrapper'
import {getClient} from './sanity.client'
import PreviewPostsLayout from './PreviewPostsLayout'

// const PreviewPostsLayout = dynamic(() => import('./PreviewPostsLayout'))

export default async function Posts() {
  const client = getClient(getDraftModeToken())
  const posts = await client.fetch<PostsLayoutProps['data']>(
    query,
    {},
    {
      cache: 'force-cache',
      next: {
        tags: ['post', 'author'],
      },
    },
  )

  /*
  return (
    <PreviewWrapper preview={draftMode().isEnabled} query={query} initialData={posts}>
      <PostsLayout draftMode={draftMode().isEnabled} />
    </PreviewWrapper>
  )
  // */

  // /*
  return (
    <LiveQuery
      enabled={draftMode().isEnabled}
      query={query}
      initialData={posts}
      as={PreviewPostsLayout}
    >
      <PostsLayout data={posts} draftMode={draftMode().isEnabled} />
    </LiveQuery>
  )
  // */
  /*
  return preview ? (
    <PreviewProvider token={preview.token}>
      <PreviewPosts data={posts} draftMode={draftMode().isEnabled} />
    </PreviewProvider>
  ) : (
    <PostsLayout data={posts} draftMode={draftMode().isEnabled} />
  )
  // */
}
