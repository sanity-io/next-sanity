import {NextStudio} from 'next-sanity/studio'

import config from './config'

export {metadata, viewport} from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} history="hash" />
}
