'use client'

import {useLiveQuery} from '@sanity/preview-kit/use-live-query'
import {PostsLayout, type PostsLayoutProps, query} from 'app/PostsLayout'

export default function PreviewPosts({data: serverSnapshot, draftMode}: PostsLayoutProps) {
  const [data, loading] = useLiveQuery(serverSnapshot, query)
  return <PostsLayout data={data} loading={loading} draftMode={draftMode} />
}
