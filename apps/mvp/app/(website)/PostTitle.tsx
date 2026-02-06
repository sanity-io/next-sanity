'use client'

import {defineQuery} from 'next-sanity'
import {usePresentationQuery} from 'next-sanity/hooks'

const postTitleQuery = defineQuery(`*[_type == "post" && _id == $id][0].title`)

export function PostTitle({id, title}: {id: string; title: string | null}) {
  const presentationQuery = usePresentationQuery({query: postTitleQuery, params: {id}, stega: true})

  // oxlint-disable-next-line no-console
  console.log(
    `<PostsTitle id=${JSON.stringify(id)} title=${JSON.stringify(title)} /> usePresentationQuery()`,
    presentationQuery,
  )

  return presentationQuery.data ?? title
}
