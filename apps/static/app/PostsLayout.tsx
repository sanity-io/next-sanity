import {q} from '#groqd'
import {memo} from 'react'

import {Image} from './Image'

const postsQuery = q.star
  .filterByType('post')
  .order('publishedAt desc', '_updatedAt desc')
  .project((sub) => ({
    _id: sub.field('_id'),
    _type: sub.field('_type'),
    title: sub.field('title'),
    slug: sub.field('slug.current'),
    mainImage: sub.field('mainImage').project({asset: true, crop: true, hotspot: true, alt: true}),
    publishedAt: sub.field('publishedAt'),
    author: sub
      .field('author')
      .deref()
      .project((sub) => ({
        name: true,
        image: sub.field('image').project({asset: true, crop: true, hotspot: true, alt: true}),
      })),
    status: sub.select({
      '_originalId in path("drafts.**")': q.value('draft'),
      'default': q.value('published'),
    }),
  }))

export const {query} = postsQuery

export type PostsLayoutProps = {
  data: unknown[]
}

const PostsLayout = memo(function Posts(props: PostsLayoutProps) {
  const posts = postsQuery.parse(props.data)

  return (
    <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
      {posts.map((post) => {
        return (
          <div
            key={post.title}
            className="relative flex flex-col overflow-hidden rounded-lg shadow-lg"
          >
            <div className="shrink-0">
              {post.mainImage ? (
                <Image
                  // @ts-expect-error - TODO: fix this
                  src={post.mainImage}
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
                <div className="shrink-0">
                  <span className="sr-only">{post.author?.name}</span>
                  {post.author?.image ? (
                    <Image
                      className="rounded-full"
                      // @ts-expect-error - TODO: fix this
                      src={post.author.image}
                      height={40}
                      width={40}
                    />
                  ) : null}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    <a className="hover:underline">{post.author?.name}</a>
                  </p>
                  {post.publishedAt && (
                    <div className="flex space-x-1 text-sm text-gray-500">
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toDateString()}
                      </time>
                      <span aria-hidden="true">&middot;</span>
                    </div>
                  )}
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
