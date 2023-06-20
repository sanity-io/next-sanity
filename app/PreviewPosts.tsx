'use client'

import {Posts, type PostsProps, query} from 'app/Posts'
import {useLiveQuery} from 'src/preview'

export default function PreviewPosts({data: serverSnapshot}: PostsProps) {
  const [data, loading] = useLiveQuery(serverSnapshot, query)
  return <Posts data={data} loading={loading} />
}
