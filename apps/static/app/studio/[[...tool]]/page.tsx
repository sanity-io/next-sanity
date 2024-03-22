import {NextStudio} from 'next-sanity/studio'

import config from '@/sanity.config'

export const dynamic = 'force-static'

export {metadata, viewport} from 'next-sanity/studio'

export async function generateStaticParams() {
  return [{tool: ['structure']}, {tool: ['vision']}]
}

export default function StudioPage() {
  return <NextStudio config={config} />
}
