'use client'

import {type PostsProps, Posts, query} from 'app/Posts'
import {usePreview as _usePreview} from 'app/sanity.preview'
import {type UsePreview} from 'src/preview'

const usePreview: UsePreview<PostsProps['data']> = _usePreview

export default function PreviewPosts({token = null}: {token: string | null}) {
  const data = usePreview(token, query) || []
  return <Posts data={data} />
}
