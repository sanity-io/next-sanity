/* eslint-disable @next/next/no-html-link-for-pages */
import {Posts, PostsProps, query} from 'app/Posts'
import PreviewPosts from 'app/PreviewPosts'
import {createClient} from 'app/sanity.client'
import {PreviewSuspense} from 'app/sanity.preview'
import {draftMode} from 'next/headers'
import Link from 'next/link'
import {cache} from 'react'

const client = createClient()
const clientFetch = cache(client.fetch.bind(client))

export default async function IndexPage() {
  const isDraftMode = draftMode().isEnabled
  let token = null
  let posts: PostsProps['data']

  if (isDraftMode) {
    // eslint-disable-next-line no-process-env
    token = process.env.SANITY_API_READ_TOKEN
    if (!token) {
      throw new TypeError(`Missing SANITY_API_READ_TOKEN`)
    }
    const previewClient = client.withConfig({token, useCdn: false})
    posts = await previewClient.fetch(query)
  } else {
    posts = await clientFetch(query)
  }

  return (
    <>
      <div className="relative bg-gray-50 px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="absolute inset-0">
          <div className="sm:h-2/3 h-1/3 bg-white" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {isDraftMode ? 'Draft Mode' : 'Not in Draft Mode'}
            </h2>
            {isDraftMode && (
              <>
                <p className="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4">
                  Using a read token, works in Safari and Incognito mode.
                </p>
                <a
                  href="/disable"
                  className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                >
                  Stop previewing drafts
                </a>
              </>
            )}
            {!isDraftMode && (
              <>
                <a
                  href="/enable"
                  className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                >
                  Preview drafts
                </a>
              </>
            )}
          </div>
          {isDraftMode ? (
            <PreviewSuspense fallback={<Posts data={posts} />}>
              <PreviewPosts token={token} serverSnapshot={posts} />
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
