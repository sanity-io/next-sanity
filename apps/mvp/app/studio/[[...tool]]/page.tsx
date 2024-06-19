import {NextStudio} from 'next-sanity/studio'

export const dynamic = 'force-static'

export {metadata, viewport} from 'next-sanity/studio'

let config: Promise<typeof import('@/sanity.config')>

if (typeof window !== 'undefined') {
  config = import('@/sanity.config')
}

export default function StudioPage() {
  return <NextStudio config={config} />
}
