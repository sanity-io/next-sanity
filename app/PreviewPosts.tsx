'use client'

import {Posts, type PostsProps, query} from 'app/Posts'
import {useListeningQuery} from 'src/preview'

export default function PreviewPosts({data: serverSnapshot}: PostsProps) {
  const data = useListeningQuery(serverSnapshot, query) || []
  return <Posts data={data} />
}
