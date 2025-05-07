import {NextStudio} from 'next-sanity/studio'

import config from '@/sanity.config'

export const dynamic = 'error'

export default function StudioPage() {
  return <NextStudio config={config} history="hash" />
}
