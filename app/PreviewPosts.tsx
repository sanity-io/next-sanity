'use client'

import {type PostsProps, Posts, query} from 'app/Posts'
import {usePreview as _usePreview} from 'app/sanity.preview'
import {type UsePreview} from 'src/preview'

const usePreview: UsePreview<PostsProps['data']> = _usePreview

export default function PreviewPosts({
  token = null,
  serverSnapshot,
}: {
  token: string | null
  serverSnapshot: PostsProps['data']
}) {
  const data = usePreview(token, query, {}, serverSnapshot) || []
  return <Posts data={data} />
}
