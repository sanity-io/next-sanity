import config from 'sanity.config'
import {NextStudio} from 'src/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
