'use client'

import {createHashHistory} from 'history'
import {Studio} from 'sanity'

import config from '@/sanity.config'

// This app is a static export, so a catch-all route cannot serve deep links
// like /studio/structure/post. Hash history keeps the tool and document paths
// in the fragment, which is also the shape stega.studioUrl in
// app/sanity.client.ts produces.
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
