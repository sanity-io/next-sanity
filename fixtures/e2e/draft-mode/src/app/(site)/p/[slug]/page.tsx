import {stegaClean} from 'next-sanity'
import {resolvePerspectiveFromCookies, type LivePerspective} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'
import Link from 'next/link'
import {Suspense} from 'react'

import {postQuery, sanityFetch} from '../../../sanity'
import {toggleDraftMode} from './actions'

export function generateStaticParams() {
  return [{slug: 'a'}, {slug: 'b'}]
}

async function Post({
  slug,
  perspective,
  stega,
}: {
  slug: string
  perspective: LivePerspective
  stega: boolean
}) {
  'use cache'
  const {data} = await sanityFetch({query: postQuery, params: {slug}, perspective, stega})
  if (!data || typeof data !== 'object' || !('title' in data) || typeof data.title !== 'string') {
    throw new Error(`Unexpected post for slug "${slug}"`)
  }
  const {title} = data
  return (
    <>
      <p id="title">{stegaClean(title)}</p>
      <p id="stega">{stegaClean(title) === title ? 'clean' : 'encoded'}</p>
      <p id="perspective">{JSON.stringify(perspective)}</p>
    </>
  )
}

async function DraftPost({slug}: {slug: string}) {
  const perspective = await resolvePerspectiveFromCookies({cookies: await cookies()})
  return <Post slug={slug} perspective={perspective} stega />
}

export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {isEnabled} = await draftMode()
  return (
    <main>
      <p id="slug">{slug}</p>
      <Link id="other" href={slug === 'a' ? '/p/b' : '/p/a'} prefetch={false}>
        Other post
      </Link>
      <form action={toggleDraftMode}>
        <button id="toggle-draft-mode">Toggle draft mode</button>
      </form>
      {isEnabled ? (
        <Suspense fallback={<p>Loading draft</p>}>
          <DraftPost slug={slug} />
        </Suspense>
      ) : (
        <Post slug={slug} perspective="published" stega={false} />
      )}
    </main>
  )
}
