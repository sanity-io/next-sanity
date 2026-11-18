import {Suspense} from 'react'

import {PresentationEmulator} from './PresentationEmulator'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

async function Emulator({searchParams}: {searchParams: SearchParams}) {
  const {src} = await searchParams
  return <PresentationEmulator src={typeof src === 'string' ? src : ''} />
}

export default function PresentationPage({searchParams}: {searchParams: SearchParams}) {
  return (
    <Suspense>
      <Emulator searchParams={searchParams} />
    </Suspense>
  )
}
