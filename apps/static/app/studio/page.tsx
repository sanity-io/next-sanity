import {NextStudio} from 'next-sanity/studio'

import config from '@/sanity.config'

export {metadata, viewport} from 'next-sanity/studio'

export const dynamic = 'force-static'

export default function Studio() {
  return <NextStudio config={config} history="hash" />
}
