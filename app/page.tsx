/* eslint-disable @next/next/no-html-link-for-pages */
import {Posts, PostsProps, query} from 'app/Posts'
import PreviewPosts from 'app/PreviewPosts'
import PreviewProvider from 'app/PreviewProvider'
import {draftMode} from 'next/headers'
import Link from 'next/link'

import {getClient} from './sanity.client'

export default async function IndexPage() {
  // eslint-disable-next-line no-process-env
  const preview = draftMode().isEnabled ? {token: process.env.SANITY_API_READ_TOKEN!} : undefined
  const client = getClient(preview)
  const posts = await client.fetch<PostsProps['data']>(
    query,
    {},
    // {next: {revalidate: 30}}
  )

  return (
    <>
      <div className="relative bg-gray-50 px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="absolute inset-0">
          <div className="h-1/3 bg-white sm:h-2/3" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {preview ? 'Draft Mode' : 'Not in Draft Mode'}
            </h2>
            {preview && (
              <a
                href="/api/disable-draft"
                className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
              >
                Stop previewing drafts
              </a>
            )}
            {!preview && (
              <>
                <a
                  href="/api/draft"
                  className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                >
                  Preview drafts
                </a>
              </>
            )}
          </div>
          {preview ? (
            <PreviewProvider token={preview.token}>
              <PreviewPosts data={posts} draftMode={draftMode().isEnabled} />
            </PreviewProvider>
          ) : (
            <Posts data={posts} draftMode={draftMode().isEnabled} />
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
