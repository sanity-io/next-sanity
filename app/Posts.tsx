/* eslint-disable @next/next/no-img-element */
import {urlForImage} from 'app/sanity.image'
import {q} from 'groqd'
import {memo} from 'react'

/*
const postFields = groq`
  _id,
  title,
  "slug": slug.current,
  "author": author->{name, image},
  mainImage,
  publishedAt,
`
export const indexQuery = groq`
*[_type == "post"] | order(publishedAt desc, _updatedAt desc) {
  ${postFields}
}`

const imageWithCropAndHotspot = q.grab({
  _type: q.string(),
  asset: q(
    'asset',
    q.grab({
      _ref: q.string(),
      _type: q.string(),
    })
    ),
    crop: q(
      'crop',
      q.grab({
        _type: q.string(),
        bottom: q.number(),
        left: q.number(),
        right: q.number(),
        top: q.number(),
      })
      ),
      hotspot: q(
        'hotspot',
        q.grab({
          _type: q.string(),
          height: q.number(),
          width: q.number(),
          x: q.number(),
          y: q.number(),
        })
        ),
      })
      // */

const {query, schema} = q(
  '*',
  q.filter("_type == 'post'"),
  q.grab({
    _id: q.string(),
    title: q.string().optional(),
    slug: q('slug', q.grabOne('current', q.string().optional())),
    // mainImage: q('mainImage', imageWithCropAndHotspot),
    mainImage: q.unknown().optional(),
    publishedAt: q.date().optional(),
    author: q(
      'author',
      q.deref(),
      q.grab({
        name: q.string().optional(),
        // image: q('image', imageWithCropAndHotspot),
        image: q.unknown().optional(),
      })
    ),
  }),
  q.order('publishedAt desc', '_updatedAt desc')
)

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
