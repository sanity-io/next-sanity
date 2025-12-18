import {unstable__adapter, unstable__environment} from 'next-sanity'
import {resolvePerspectiveFromCookies} from 'next-sanity/experimental/live'
/* eslint-disable @next/next/no-html-link-for-pages */
import {cookies, draftMode} from 'next/headers'
import Link from 'next/link'

import PostsLayout, {postsQuery} from '@/app/(website)/PostsLayout'

import {sanityFetch} from './live'

export default async function IndexPage() {
  const isDraftMode = (await draftMode()).isEnabled
  const perspective = isDraftMode
    ? await resolvePerspectiveFromCookies({cookies: await cookies()})
    : 'published'
  const {data, tags} = await sanityFetch({
    query: postsQuery.query,
    perspective,
    stega: isDraftMode,
  })

  return (
    <>
      <div
        className="relative bg-gray-50 px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28"
        data-adapter={unstable__adapter}
        data-environment={unstable__environment}
      >
        <div className="relative mx-auto max-w-7xl">
          <PostsLayout data={data} draftMode={isDraftMode} />
          <p>{JSON.stringify({perspective, tags: tags.toSorted()})}</p>
        </div>
      </div>
      <div className="flex gap-2 text-center">
        <span className="mx-2 my-4 inline-block rounded-full border border-transparent bg-gray-600 px-4 py-1 text-sm font-semibold text-white">
          Resolve perspective
        </span>
        <Link
          prefetch={false}
          href="/no-resolve-perspective"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          No resolve perspective
        </Link>
        <Link
          prefetch={false}
          href="/only-production"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          Only production
        </Link>
        <Link
          prefetch={false}
          href="/studio"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          Open Studio
        </Link>
      </div>
    </>
  )
}
