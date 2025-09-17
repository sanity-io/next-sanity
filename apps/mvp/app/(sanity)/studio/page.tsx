'use cache'

import {NextStudio} from 'next-sanity/studio'

import config from '@/sanity.config'

export default async function StudioPage() {
  return <NextStudio config={config} history="hash" />
}
