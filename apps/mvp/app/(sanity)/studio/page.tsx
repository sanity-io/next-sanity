'use cache'

import {NextStudio} from 'next-sanity/studio'
import {unstable_cacheLife as cacheLife} from 'next/cache'

import config from '@/sanity.config'

export default async function StudioPage() {
  cacheLife('max')
  return <NextStudio config={config} history="hash" />
}
