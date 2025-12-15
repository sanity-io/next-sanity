/* eslint-disable @next/next/no-img-element */
import {q} from '#groqd'
import {createDataAttribute} from 'next-sanity'

import {Image} from './Image'

export const postsQuery = q.star
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
  data: unknown
  draftMode: boolean
}

export default async function Posts(props: PostsLayoutProps) {
  'use cache: remote'

  const posts = postsQuery.parse(props.data)
  console.log('PostsLayout', {posts})

  const random = Math.random()

  return (
    <>
      <div className={`mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3`}>
        {posts.map((post) => {
          const dataAttribute = createDataAttribute({
            baseUrl: '/studio',
            workspace: 'stable',
            id: post._id,
            type: post._type,
          })
          return (
            <div
              key={post._id}
              className="relative flex flex-col overflow-hidden rounded-lg shadow-lg"
              data-sanity={dataAttribute('slug')}
            >
              <div className="shrink-0">
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
                  {post.author ? (
                    <div className="shrink-0">
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
                  ) : null}
                  <div className="ml-3">
                    {post.author ? (
                      <p className="text-sm font-medium text-gray-900">
                        <a className="hover:underline">{post.author.name}</a>
                      </p>
                    ) : null}
                    {post.publishedAt ? (
                      <div className="flex space-x-1 text-sm text-gray-500">
                        {post.publishedAt && (
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toDateString()}
                          </time>
                        )}
                        <span aria-hidden="true">&middot;</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              {props.draftMode && post.status === 'draft' && (
                <span className="absolute top-2 left-2 rounded-md bg-white/50 px-2 py-1 text-xs font-semibold uppercase backdrop-blur-sm">
                  {post.status}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-6">Random number: {random}</p>
    </>
  )
}
