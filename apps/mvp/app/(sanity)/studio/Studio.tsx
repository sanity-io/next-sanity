'use client'

import {createHashHistory} from 'history'
import {Studio} from 'sanity'

import config from '@/sanity.config'

// The Studio is mounted at a single route, so its router keeps the tool and
// document paths in the URL hash instead of needing an app/studio/[[...tool]]
// catch-all. Deep links keep the shape /studio#/structure/post that the
// stega.studioUrl in app/sanity.client.ts expects.
const history = createHashHistory()

const style = {
  height: '100vh',
  maxHeight: '100dvh',
  overscrollBehavior: 'none',
  WebkitFontSmoothing: 'antialiased',
  overflow: 'auto',
} satisfies React.CSSProperties

export default function StudioClient() {
  return (
    <div style={style}>
      <Studio config={config} unstable_history={history} unstable_globalStyles />
    </div>
  )
}
