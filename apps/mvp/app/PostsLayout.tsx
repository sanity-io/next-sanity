/* eslint-disable @next/next/no-img-element */
import {q} from 'groqd'
import {memo} from 'react'

import {urlForImage} from '@/app/sanity.image'

const {query, schema} = q('*')
  .filter("_type == 'post'")
  .grab({
    _id: q.string(),
    title: q.string().optional(),
    slug: q('slug').grabOne('current', q.string().optional()),
    // mainImage: q('mainImage', imageWithCropAndHotspot),
    mainImage: q.unknown().optional(),
    publishedAt: q.date().optional(),
    author: q('author').deref().grab({
      name: q.string().optional(),
      // image: q('image', imageWithCropAndHotspot),
      image: q.unknown().optional(),
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
      {posts.map((post) => (
        <div
          key={post.title}
          className="relative flex flex-col overflow-hidden rounded-lg shadow-lg"
        >
          <div className="flex-shrink-0">
            {post.mainImage ? (
              <img
                className="h-48 w-full object-cover"
                src={urlForImage(post.mainImage).height(256).width(256).fit('crop').url()}
                alt=""
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
              <div className="flex-shrink-0">
                <span className="sr-only">{post.author.name}</span>
                {post.author?.image ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={urlForImage(post.author.image).url()}
                    alt=""
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
          {props.draftMode && post.status === 'draft' && (
            <span className="absolute left-2 top-2 rounded-md bg-white/50 px-2 py-1 text-xs font-semibold uppercase backdrop-blur">
              {post.status}
            </span>
          )}
        </div>
      ))}
    </div>
  )
})

export default PostsLayout
