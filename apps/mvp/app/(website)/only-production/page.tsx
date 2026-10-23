import {defineLive, type DefinedFetchType} from 'next-sanity/live'
import Link from 'next/link'

import PostsLayout, {postsQuery} from '@/app/(website)/PostsLayout'
import {client} from '@/app/sanity.client'

import {ContentSourceMapDebug} from '../ContentSourceMapDebug'

const {sanityFetch, SanityLive} = defineLive({client})

// The app's one shared 'use cache' boundary. `sanityFetch` calls
// `cacheTag`/`cacheLife` internally but doesn't create the boundary —
// this wrapper provides it once, so callers don't add their own.
const cachedSanity: DefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}

export default async function IndexPage() {
  const {data, sourceMap} = await cachedSanity({
    query: postsQuery.query,
  })

  return (
    <>
      <ContentSourceMapDebug sourceMap={sourceMap} />
      <div className="relative bg-gray-50 px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="relative mx-auto max-w-7xl">
          <PostsLayout data={data} draftMode={false} />
        </div>
      </div>
      <div className="flex gap-2 text-center">
        <Link
          prefetch={false}
          href="/"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          Resolve perspective
        </Link>
        <Link
          prefetch={false}
          href="/no-resolve-perspective"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          No resolve perspective
        </Link>
        <span className="mx-2 my-4 inline-block rounded-full border border-transparent bg-gray-600 px-4 py-1 text-sm font-semibold text-white">
          Only production
        </span>
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
      <SanityLive />
    </>
  )
}
