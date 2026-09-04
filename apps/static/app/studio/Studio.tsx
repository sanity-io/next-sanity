'use client'

import {createHashHistory} from 'history'
import {Studio} from 'sanity'

import config from '@/sanity.config'

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
