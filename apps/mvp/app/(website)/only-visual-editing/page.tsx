import {unstable__adapter, unstable__environment} from 'next-sanity'
import {
  defineLive,
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
  type LivePerspective,
} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import Link from 'next/link'
import {Suspense} from 'react'

import PostsLayout, {postsQuery} from '@/app/(website)/PostsLayout'
import {client} from '@/app/sanity.client'

import {ContentSourceMapDebug} from '../ContentSourceMapDebug'

const token = process.env.SANITY_API_READ_TOKEN!
const {sanityFetch} = defineLive({
  client,
  serverToken: token,
  browserToken: process.env.NEXT_PUBLIC_SANITY_API_BROWSER_TOKEN || token,
  strict: true,
})

async function CachedIndexPage({
  perspective,
  variant,
  stega,
}: {
  perspective: LivePerspective
  variant?: string
  stega: boolean
}) {
  'use cache'
  const {data, sourceMap, tags} = await sanityFetch({
    query: postsQuery.query,
    perspective,
    variant,
    stega,
  })

  return (
    <>
      <ContentSourceMapDebug sourceMap={sourceMap} />
      <p>{JSON.stringify({perspective, variant, tags: tags.toSorted()})}</p>
      <PostsLayout data={data} draftMode={false} />
    </>
  )
}

async function DynamicIndexPage() {
  const {isEnabled: isDraftMode} = await draftMode()
  const jar = isDraftMode ? await cookies() : null
  const perspective = jar ? await resolvePerspectiveFromCookies({cookies: jar}) : 'published'
  const variant = jar ? await resolveVariantFromCookies({cookies: jar}) : undefined
  const stega = isDraftMode

  return <CachedIndexPage perspective={perspective} variant={variant} stega={stega} />
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
          {isDraftMode ? (
            <Suspense>
              <DynamicIndexPage />
            </Suspense>
          ) : (
            <CachedIndexPage perspective="published" stega={false} />
          )}
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
        <Link
          prefetch={false}
          href="/only-production"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:outline-hidden"
        >
          Only production
        </Link>
        <span className="mx-2 my-4 inline-block rounded-full border border-transparent bg-gray-600 px-4 py-1 text-sm font-semibold text-white">
          Only Visual Editing
        </span>
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
