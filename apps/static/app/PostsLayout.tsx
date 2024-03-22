/* eslint-disable @next/next/no-img-element */
import {q, sanityImage} from 'groqd'
import {memo} from 'react'

import {Image} from './Image'

const {query, schema} = q('*')
  .filter("_type == 'post'")
  .grab({
    _id: q.string(),
    _type: q.literal('post'),
    title: q.string().optional(),
    slug: q('slug').grabOne('current', q.string().optional()),
    mainImage: sanityImage('mainImage', {
      withCrop: true,
      withHotspot: true,
      additionalFields: {
        alt: q.string().nullish(),
      },
    }),
    publishedAt: q.date().optional(),
    author: q('author')
      .deref()
      .grab({
        name: q.string().optional(),
        image: sanityImage('image', {
          withCrop: true,
          withHotspot: true,
          additionalFields: {
            alt: q.string().nullish(),
          },
        }),
      }),
    status: q.select({
      '_originalId in path("drafts.**")': ['"draft"', q.literal('draft')],
      default: ['"published"', q.literal('published')],
    }),
  })
  .order('publishedAt desc', '_updatedAt desc')

export {query}

export type PostsLayoutProps = {
  data: unknown[]
}

const PostsLayout = memo(function Posts(props: PostsLayoutProps) {
  const posts = schema.parse(props.data)

  return (
    <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
      {posts.map((post) => {
        return (
          <div
            key={post.title}
            className="relative flex flex-col overflow-hidden rounded-lg shadow-lg"
          >
            <div className="flex-shrink-0">
              {post.mainImage ? (
                <Image src={post.mainImage as any} width={512} height={380} />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col justify-between bg-white p-6">
              <div className="flex-1">
                <a className="mt-2 block">
                  <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                </a>
              </div>
              <div className="mt-6 flex items-center">
                <div className="flex-shrink-0">
                  <span className="sr-only">{post.author.name}</span>
                  {post.author?.image ? (
                    <Image
                      className="rounded-full"
                      src={post.author.image as any}
                      height={40}
                      width={40}
                    />
                  ) : null}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    <a className="hover:underline">{post.author.name}</a>
                  </p>
                  <div className="flex space-x-1 text-sm text-gray-500">
                    <time dateTime={post.publishedAt?.toJSON()}>
                      {post.publishedAt?.toLocaleDateString()}
                    </time>
                    <span aria-hidden="true">&middot;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default PostsLayout
