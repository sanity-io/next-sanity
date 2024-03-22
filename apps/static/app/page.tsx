/* eslint-disable @next/next/no-html-link-for-pages */
import {unstable__adapter, unstable__environment} from '@sanity/client'
import Link from 'next/link'

import PostsLayout, {type PostsLayoutProps, query} from '@/app/PostsLayout'
import {sanityFetch} from '@/app/sanity.fetch'

export const dynamic = 'force-static'

export default async function IndexPage() {
  const posts = await sanityFetch<PostsLayoutProps['data']>({query})

  return (
    <>
      <div
        className="relative bg-gray-50 px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24"
        data-adapter={unstable__adapter}
        data-environment={unstable__environment}
      >
        <div className="absolute inset-0">
          <div className="h-1/3 bg-white sm:h-2/3" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Visual Editing Only
            </h2>
          </div>
          <PostsLayout data={posts} />
        </div>
      </div>
      <div className="flex text-center">
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
