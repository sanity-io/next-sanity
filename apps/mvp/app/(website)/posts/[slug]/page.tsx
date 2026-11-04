import {defineQuery} from 'next-sanity'
import {defineGenerateStaticParams, STATIC_PARAMS_PLACEHOLDER} from 'next-sanity/static-params'
import Link from 'next/link'
import {notFound} from 'next/navigation'

import {client} from '@/app/sanity.client'

const postQuery = defineQuery(
  `*[_type == "post" && slug.current == $slug][0]{title, "slug": slug.current, publishedAt}`,
)

export const {generateStaticParams} = defineGenerateStaticParams({
  client,
  query: postQuery,
  order: '_updatedAt desc',
  limit: 100,
})

async function fetchPost(slug: string) {
  'use cache'
  return client.fetch(postQuery, {slug}, {perspective: 'published', stega: false})
}

export default async function PostPage({params}: PageProps<'/posts/[slug]'>) {
  const {slug} = await params
  if (slug === STATIC_PARAMS_PLACEHOLDER) notFound()
  const post = await fetchPost(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{post.title}</h1>
      {post.publishedAt ? (
        <time className="mt-2 block text-sm text-gray-500" dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toDateString()}
        </time>
      ) : null}
      <p className="mt-4 text-gray-600">Slug: {post.slug}</p>
      <Link href="/" className="mt-8 inline-block text-blue-600 hover:underline">
        Back to all posts
      </Link>
    </article>
  )
}
