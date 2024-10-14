'use client'

import {useLiveQuery} from 'next-sanity/preview'

import PostsLayout, {PostsLayoutProps, query} from './PostsLayout'

export default function PreviewPosts(props: {data: PostsLayoutProps['data']}) {
  const [posts] = useLiveQuery<PostsLayoutProps['data']>(props.data, query)
  return <PostsLayout data={posts} draftMode />
}
