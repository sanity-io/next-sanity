import {PostsLayout, PostsLayoutProps, query} from 'app/PostsLayout'
import dynamic from 'next/dynamic'
import {draftMode} from 'next/headers'

import {getClient} from './sanity.client'

const PreviewProvider = dynamic(() => import('./PreviewProvider'))
const PreviewPosts = dynamic(() => import('./PreviewPosts'))

export default async function Posts() {
  // eslint-disable-next-line no-process-env
  const preview = draftMode().isEnabled ? {token: process.env.SANITY_API_READ_TOKEN!} : undefined
  const client = getClient(preview)
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

  return preview ? (
    <PreviewProvider token={preview.token}>
      <PreviewPosts data={posts} draftMode={draftMode().isEnabled} />
    </PreviewProvider>
  ) : (
    <PostsLayout data={posts} draftMode={draftMode().isEnabled} />
  )
}
