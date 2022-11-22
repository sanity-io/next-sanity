/* eslint-disable @next/next/no-html-link-for-pages */
import {Posts, query} from 'app/Posts'
import PreviewPosts from 'app/PreviewPosts'
import {createClient} from 'app/sanity.client'
import {PreviewSuspense} from 'app/sanity.preview'
import {previewData} from 'next/headers'
import Link from 'next/link'

export default async function IndexPage() {
  const thePreviewData = previewData()
  const preview = !!thePreviewData
  const token = thePreviewData?.token

  const client = createClient()
  const posts = await client.fetch(query)

  return (
    <>
      <div className="relative bg-gray-50 px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0">
          <div className="h-1/3 bg-white sm:h-2/3" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {preview ? 'Preview Mode' : 'Not in Preview Mode'}
            </h2>
            {preview && (
              <>
                <p className="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4">
                  {token
                    ? 'Using a read token, works in Safari and Incognito mode. No Sanity account needed.'
                    : 'Using cookie based auth, must be logged in to Sanity in order to work.'}
                </p>
                <a
                  href="/api/exit-preview"
                  className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                >
                  Exit preview
                </a>
              </>
            )}
            {!preview && (
              <>
                <a
                  href="/api/preview"
                  className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                >
                  Preview with cookie
                </a>
                <a
                  href="/api/preview?token=1"
                  className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                >
                  Preview with token
                </a>
              </>
            )}
          </div>
          {preview ? (
            <PreviewSuspense fallback={<Posts data={posts} />}>
              <PreviewPosts token={token} />
            </PreviewSuspense>
          ) : (
            <Posts data={posts} />
          )}
        </div>
      </div>
      <div className="text-center">
        <Link
          href="/studio"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          Open Studio
        </Link>
      </div>
    </>
  )
}

// eslint-disable-next-line no-warning-comments
// @TODO remember to set useCdn = true
export const revalidate = 60
