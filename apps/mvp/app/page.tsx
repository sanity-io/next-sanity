/* eslint-disable @next/next/no-html-link-for-pages */
import Link from 'next/link'
import {unstable__adapter, unstable__environment} from 'next-sanity'
import {Suspense} from 'react'

import ConditionalPreviewProvider from './ConditionalPreviewProvider'
import Posts from './Posts'

export default function IndexPage() {
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
              Preview Kit
            </h2>
          </div>
          <ConditionalPreviewProvider>
            <Suspense>
              <Posts />
            </Suspense>
          </ConditionalPreviewProvider>
        </div>
      </div>
      <div className="flex text-center">
        <Link
          href="/studio"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          Open Studio
        </Link>
        <Link
          href="/visual-editing-only"
          className="mx-2 my-4 inline-block rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-transparent hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          Visual Editing Only
        </Link>
      </div>
    </>
  )
}
