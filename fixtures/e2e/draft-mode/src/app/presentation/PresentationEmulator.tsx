'use client'

import {createConnectionMachine, createController, type ChannelInstance} from '@sanity/comlink'
import {
  createCompatibilityActors,
  type VisualEditingControllerMsg,
  type VisualEditingNodeMsg,
} from '@sanity/presentation-comlink'
import {useEffect, useRef, useState} from 'react'

/**
 * The iframe can finish loading before this effect subscribes, which happens
 * when `next dev` serves an already compiled route. `load` does not fire again
 * then, so also check the frame that is already in place.
 */
function loadedPreviewWindow(iframe: HTMLIFrameElement) {
  const win = iframe.contentWindow
  if (!win) return
  try {
    if (win.location.href === 'about:blank') return
  } catch {
    // A cross-origin document is loaded, which is the preview we are waiting for.
  }
  return win
}

/**
 * The Studio side of the Presentation tool handshake with `<VisualEditing />`, without a Studio.
 * The preview URL is passed as `?src=` and should be cross-site to mirror a real Studio embed.
 */
export function PresentationEmulator({src}: {src: string}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const channelRef = useRef<ChannelInstance<
    VisualEditingControllerMsg,
    VisualEditingNodeMsg
  > | null>(null)
  const [status, setStatus] = useState('idle')
  const [perspectiveRequests, setPerspectiveRequests] = useState(0)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!src || !iframe) return
    const controller = createController({targetOrigin: new URL(src).origin})
    const channel = controller.createChannel<VisualEditingControllerMsg, VisualEditingNodeMsg>(
      {name: 'presentation', connectTo: 'visual-editing', heartbeat: true},
      createConnectionMachine<VisualEditingControllerMsg, VisualEditingNodeMsg>().provide({
        actors: createCompatibilityActors<VisualEditingControllerMsg>(),
      }),
    )
    channelRef.current = channel
    channel.onStatus((event) => setStatus(event.status))
    channel.on('visual-editing/fetch-perspective', () => {
      setPerspectiveRequests((count) => count + 1)
      return {perspective: 'drafts' as const}
    })
    const stop = channel.start()
    const onLoad = () => {
      const win = loadedPreviewWindow(iframe)
      if (win) controller.addTarget(win)
    }
    iframe.addEventListener('load', onLoad)
    onLoad()
    return () => {
      iframe.removeEventListener('load', onLoad)
      stop()
      controller.destroy()
      channelRef.current = null
    }
  }, [src])

  const postPerspective = (perspective: 'published' | 'drafts') =>
    channelRef.current?.post('presentation/perspective', {perspective})

  return (
    <main>
      <p id="status">{status}</p>
      <p id="perspective-requests">{perspectiveRequests}</p>
      <button id="perspective-published" onClick={() => postPerspective('published')}>
        Published
      </button>
      <button id="perspective-drafts" onClick={() => postPerspective('drafts')}>
        Drafts
      </button>
      {/* oxlint-disable-next-line iframe-missing-sandbox -- Studio's Presentation tool doesn't sandbox the preview either */}
      {src && <iframe id="preview" ref={iframeRef} src={src} width={1000} height={700} />}
    </main>
  )
}
