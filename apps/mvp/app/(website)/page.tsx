import {unstable__adapter, unstable__environment} from 'next-sanity'
import {defineLive, resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cacheLife} from 'next/cache'
import {cookies, draftMode} from 'next/headers'
import Link from 'next/link'
import {Suspense} from 'react'

import PostsLayout, {postsQuery} from '@/app/(website)/PostsLayout'
import {client} from '@/app/sanity.client'

const token = process.env.SANITY_API_READ_TOKEN!
const {sanityFetch, SanityLive: Live} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})

async function getPosts(perspective: LivePerspective) {
  'use cache: remote'

  cacheLife('sanity')

  const {data, tags} = await sanityFetch({
    query: postsQuery.query,
    perspective,
    stega: perspective !== 'published',
  })
  return {data, tags}
}

async function resolvePerspective(): Promise<LivePerspective> {
  const {isEnabled: isDraftMode} = await draftMode()
  const jar = await cookies()
  if (isDraftMode) {
    return await resolvePerspectiveFromCookies({cookies: jar})
  }
  return 'published'
}

async function SanityLive() {
  const {isEnabled: isDraftMode} = await draftMode()
  return <Live includeDrafts={isDraftMode} />
}

async function CachedIndexPage() {
  'use cache'

  cacheLife('sanity')

  const perspective = 'published' satisfies LivePerspective

  const {data, tags} = await getPosts(perspective)

  return (
    <>
      <p>{JSON.stringify({perspective, tags: tags.toSorted()})}</p>
      <PostsLayout data={data} draftMode={false} />
    </>
  )
}

async function DynamicIndexPage() {
  const perspective = await resolvePerspective()

  const {data, tags} = await getPosts(perspective)

  return (
    <>
      <p>{JSON.stringify({perspective, tags: tags.toSorted()})}</p>
      <PostsLayout data={data} draftMode={true} />
    </>
  )
}

export default async function IndexPage() {
  const {isEnabled: isDraftMode} = await draftMode()
  return (
    <>
      <div
        className="relative bg-gray-50 px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28"
        data-adapter={unstable__adapter}
        data-environment={unstable__environment}
      >
        <div className="relative mx-auto max-w-7xl">
          <Suspense fallback={isDraftMode ? null : <CachedIndexPage />}>
            <DynamicIndexPage />
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
      <SanityLive />
    </>
  )
}
