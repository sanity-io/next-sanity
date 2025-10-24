'use client'

import {createClient} from 'next-sanity'
import {defineLive} from 'next-sanity/live'

const {SanityLive} = defineLive({
  client: createClient({
    projectId: 'pv8y60vp',
    dataset: 'production',
    apiVersion: '2025-10-24',
    useCdn: true,
  }),
})

export default function Home() {
  return <SanityLive />
}
