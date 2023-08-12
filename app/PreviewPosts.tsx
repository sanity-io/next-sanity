'use client'

import PostsLayout, {type PostsLayoutProps, query} from 'app/PostsLayout'
import {useLiveQuery} from 'src/preview'

export default function PreviewPosts({data: serverSnapshot, draftMode}: PostsLayoutProps) {
  const [data, loading] = useLiveQuery(serverSnapshot, query)
  return <PostsLayout data={data} loading={loading} draftMode={draftMode} />
}
