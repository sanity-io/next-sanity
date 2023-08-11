import dynamic from 'next/dynamic'

const Studio = dynamic(() => import('./Studio'))

export {metadata} from 'src/studio/metadata'

export default function StudioPage() {
  return <Studio />
}
