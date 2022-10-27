/* eslint-disable @next/next/no-img-element */
import {dataset, projectId} from 'demo/sanity.env'
import {urlForImage} from 'demo/sanity.helpers'
import {getClient, indexQuery, overlayDrafts} from 'demo/sanity.server'
import type {GetStaticProps} from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {useState} from 'react'

type Props = {
  allPosts: any[]
  title: string
  description: string
  authMode: any
  token: any
  preview: boolean
}

// eslint-disable-next-line no-warning-comments
// @TODO swap to React.lazy + Suspense when Studio is ready for React v18
const PreviewMode = dynamic(() => import('src/preview'))

export default function IndexPage(props: Props) {
  const [posts, setPosts] = useState(props.allPosts)
  const [authState, setAuthState] = useState('checking')

  return (
    <>
      {props.preview && (
        <PreviewMode
          projectId={projectId}
          dataset={dataset}
          initial={props.allPosts}
          query={indexQuery}
          onChange={setPosts}
          authMode={props.authMode}
          token={props.token}
          onAuth={setAuthState}
        />
      )}
      <div className="relative px-4 pt-16 pb-20 bg-gray-50 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
        <div className="absolute inset-0">
          <div className="bg-white h-1/3 sm:h-2/3" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {props.title}
            </h2>
            <p className="max-w-2xl mx-auto mt-3 text-xl text-gray-500 sm:mt-4">
              {props.description}
            </p>
          </div>
          {props.preview && (
            <div>
              <div>authState: {JSON.stringify(authState)}</div>
              <div>authMode: {JSON.stringify(props.authMode)}</div>
              <div className="text-center">
                <Link prefetch={false} href="/api/exit-preview">
                  <a>Exit preview</a>
                </Link>
              </div>
            </div>
          )}
          <div className="grid max-w-lg gap-5 mx-auto mt-12 lg:grid-cols-3 lg:max-w-none">
            {posts.map((post) => (
              <div
                key={post.title}
                className="flex flex-col overflow-hidden rounded-lg shadow-lg"
              >
                <div className="flex-shrink-0">
                  {post.mainImage && (
                    <img
                      className="object-cover w-full h-48"
                      src={urlForImage(post.mainImage).url()}
                      alt=""
                    />
                  )}
                </div>
                <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600">
                      <a href={post.category?.href} className="hover:underline">
                        {post.category?.name}
                      </a>
                    </p>
                    <a href={post.href} className="block mt-2">
                      <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                      <p className="mt-3 text-base text-gray-500">{post.description}</p>
                    </a>
                  </div>
                  <div className="flex items-center mt-6">
                    <div className="flex-shrink-0">
                      <a href={post.author.href}>
                        <span className="sr-only">{post.author.name}</span>
                        {post.author?.image && (
                          <img
                            className="w-10 h-10 rounded-full"
                            src={urlForImage(post.author?.image).url()}
                            alt=""
                          />
                        )}
                      </a>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        <a href={post.author.href} className="hover:underline">
                          {post.author.name}
                        </a>
                      </p>
                      <div className="flex space-x-1 text-sm text-gray-500">
                        <time dateTime={post.datetime}>{post.date}</time>
                        <span aria-hidden="true">&middot;</span>
                        <span>{post.readingTime} read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps<any, any, any> = async ({
  preview = false,
  previewData = {},
}) => {
  const client =
    preview && previewData?.token
      ? getClient(false).withConfig({token: previewData.token})
      : getClient(preview)
  const allPosts = overlayDrafts(await client.fetch(indexQuery))
  return {
    props: {
      allPosts,
      preview,
      title: previewData?.title || 'Blog fixture',
      description: previewData?.description || 'Used to test preview mode',
      authMode: previewData?.authMode || null,
      token: previewData?.token || null,
    },
    // If webhooks isn't setup then attempt to re-generate in 1 minute intervals
    // eslint-disable-next-line no-process-env
    revalidate: process.env.SANITY_REVALIDATE_SECRET ? undefined : 60,
  }
}
