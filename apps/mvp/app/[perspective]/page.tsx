import Link from 'next/link'
import {perspective} from 'next/root-params'
import {Suspense} from 'react'

import PostsLayout, {postsQuery} from '@/app/[perspective]/PostsLayout'
import {sanityFetch, SanityLive} from '@/app/sanity.live'

import {ContentSourceMapDebug} from './ContentSourceMapDebug'
import SanityLiveErrorBoundary from './SanityLiveErrorBoundary'

async function CachedIndexPage() {
  'use cache'
  const {data, sourceMap, tags} = await sanityFetch({query: postsQuery.query})

  return (
    <>
      <ContentSourceMapDebug sourceMap={sourceMap} />
      <p>{JSON.stringify({perspective: await perspective(), tags: tags.toSorted()})}</p>
      <PostsLayout data={data} draftMode={false} />
    </>
  )
}

export default function IndexPage() {
  return (
    <>
      <div className="relative bg-gray-50 px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="relative mx-auto max-w-7xl">
          <Suspense>
            <CachedIndexPage />
          </Suspense>
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
          href="/only-visual-editing"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          Only Visual Editing
        </Link>
        <Link
          prefetch={false}
          href="/studio"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          Open Studio
        </Link>
      </div>
      <SanityLiveErrorBoundary>
        <SanityLive onError="throw" />
      </SanityLiveErrorBoundary>
    </>
  )
}
