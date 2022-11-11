import {urlForImage} from 'app/sanity.image'
import {previewData} from 'next/headers'

export default async function IndexPage() {
  const thePreviewData = previewData()
  const preview = !!thePreviewData
  const token = thePreviewData?.token

  const posts: any[] = []

  return (
    <>
      <div className="relative px-4 pt-16 pb-20 bg-gray-50 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0">
          <div className="bg-white h-1/3 sm:h-2/3" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {preview ? 'Preview Mode' : 'Not in Preview Mode'}
            </h2>
            {preview && (
              <p className="max-w-2xl mx-auto mt-3 text-xl text-gray-500 sm:mt-4">
                {token
                  ? 'Using a read token, works in Safari and Incognito mode. No Sanity account needed.'
                  : 'Using cookie based auth, must be logged in to Sanity in order to work.'}
              </p>
            )}
          </div>
          <div className="grid max-w-lg gap-5 mx-auto mt-12 lg:max-w-none lg:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.title}
                className="flex flex-col overflow-hidden rounded-lg shadow-lg"
              >
                <div className="flex-shrink-0">
                  {post.mainImage && (
                    <img
                      className="object-cover w-full h-48"
                      src={urlForImage(post.mainImage).url()}
                      alt=""
                    />
                  )}
                </div>
                <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600">
                      <a href={post.category?.href} className="hover:underline">
                        {post.category?.name}
                      </a>
                    </p>
                    <a href={post.href} className="block mt-2">
                      <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                      <p className="mt-3 text-base text-gray-500">{post.description}</p>
                    </a>
                  </div>
                  <div className="flex items-center mt-6">
                    <div className="flex-shrink-0">
                      <a href={post.author.href}>
                        <span className="sr-only">{post.author.name}</span>
                        {post.author?.image && (
                          <img
                            className="w-10 h-10 rounded-full"
                            src={urlForImage(post.author?.image).url()}
                            alt=""
                          />
                        )}
                      </a>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        <a href={post.author.href} className="hover:underline">
                          {post.author.name}
                        </a>
                      </p>
                      <div className="flex space-x-1 text-sm text-gray-500">
                        <time dateTime={post.datetime}>{post.date}</time>
                        <span aria-hidden="true">&middot;</span>
                        <span>{post.readingTime} read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// @TODO remember to set useCdn = true
export const revalidate = 60
