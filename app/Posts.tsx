/* eslint-disable @next/next/no-img-element */
import {urlForImage} from 'app/sanity.image'
import {q} from 'groqd'
import {memo} from 'react'

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
  })
  .order('publishedAt desc', '_updatedAt desc')

export {query}

export type PostsProps = {
  data: unknown[]
}

export const Posts = memo(function Posts(props: PostsProps) {
  const posts = schema.parse(props.data)

  return (
    <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
      {posts.map((post) => (
        <div key={post.title} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
          <div className="flex-shrink-0">
            {post.mainImage ? (
              <img
                className="h-48 w-full object-cover"
                src={urlForImage(post.mainImage).url()}
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
        </div>
      ))}
    </div>
  )
})
