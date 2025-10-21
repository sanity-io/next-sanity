'use cache'

/* eslint-disable @next/next/no-html-link-for-pages */
import Link from 'next/link'
import {unstable__adapter, unstable__environment} from 'next-sanity'

import PostsLayout, {postsQuery} from '@/app/(website)/PostsLayout'

import {sanityFetch} from '../live'

export default async function IndexPage() {
  const {data} = await sanityFetch({
    query: postsQuery.query,
    perspective: 'published',
  })

  return (
    <>
      <div
        className="relative bg-gray-50 px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24"
        data-adapter={unstable__adapter}
        data-environment={unstable__environment}
      >
        <div className="relative mx-auto max-w-7xl">
          <PostsLayout data={data} draftMode={false} />
        </div>
      </div>
      <div className="flex text-center gap-2">
        <Link
          prefetch={false}
          href="/"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          Resolve perspective
        </Link>
        <Link
          prefetch={false}
          href="/no-resolve-perspective"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          No resolve perspective
        </Link>
        <span className="mx-2 my-4 inline-block rounded-full border  px-4 py-1 text-sm font-semibold border-transparent bg-gray-600 text-white">
          Only production
        </span>
        <Link
          prefetch={false}
          href="/studio"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          Open Studio
        </Link>
      </div>
    </>
  )
}
