/* eslint-disable @next/next/no-img-element */
import {q, sanityImage} from 'groqd'
import {createDataAttribute} from 'next-sanity'
import {memo} from 'react'

import {Image} from './Image'

const {query, schema} = q('*')
  .filter("_type == 'post'")
  .grab({
    _id: q.string(),
    _type: q.literal('post'),
    title: q.string().nullable(),
    slug: q('slug').grabOne('current', q.string().optional()),
    mainImage: sanityImage('mainImage', {
      withCrop: true,
      withHotspot: true,
      additionalFields: {
        alt: q.string().nullish(),
      },
    }).nullable(),
    publishedAt: q.date().nullable(),
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
      }).nullable(),
    status: q.select({
      '_originalId in path("drafts.**")': ['"draft"', q.literal('draft')],
      default: ['"published"', q.literal('published')],
    }),
  })
  .order('publishedAt desc', '_updatedAt desc')

export {query}

export type PostsLayoutProps = {
  data: unknown[]
  loading?: boolean
  draftMode: boolean
}

const PostsLayout = memo(function Posts(props: PostsLayoutProps) {
  const posts = schema.parse(props.data)

  return (
    <div
      className={`mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3 ${
        props.loading ? 'animate-pulse' : ''
      }`}
    >
      {posts.map((post) => {
        const dataAttribute = createDataAttribute({
          baseUrl: '/studio',
          workspace: 'stable',
          id: post._id,
          type: post._type,
        })
        return (
          <div
            key={post.title}
            className="relative flex flex-col overflow-hidden rounded-lg shadow-lg"
            data-sanity={dataAttribute('slug')}
          >
            <div className="flex-shrink-0">
              {post.mainImage ? (
                <Image
                  data-sanity={dataAttribute('mainImage')}
                  src={post.mainImage as any}
                  width={512}
                  height={380}
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col justify-between bg-white p-6">
              <div className="flex-1">
                <a className="mt-2 block">
                  <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                </a>
              </div>
              <div className="mt-6 flex items-center">
                {post.author ? <div className="flex-shrink-0">
                  <span className="sr-only">{post.author.name}</span>
                  {post.author?.image ? (
                    <Image
                      className="rounded-full"
                      src={post.author.image as any}
                      height={40}
                      width={40}
                    />
                  ) : null}
                </div> : null}
                <div className="ml-3">
                  {post.author ? <p className="text-sm font-medium text-gray-900">
                    <a className="hover:underline">{post.author.name}</a>
                  </p> : null}
                  {post.publishedAt ? <div className="flex space-x-1 text-sm text-gray-500">
                    <time dateTime={post.publishedAt?.toJSON()}>
                      {post.publishedAt?.toLocaleDateString()}
                    </time>
                    <span aria-hidden="true">&middot;</span>
                  </div> : null}
                </div>
              </div>
            </div>
            {props.draftMode && post.status === 'draft' && (
              <span className="absolute left-2 top-2 rounded-md bg-white/50 px-2 py-1 text-xs font-semibold uppercase backdrop-blur">
                {post.status}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default PostsLayout
