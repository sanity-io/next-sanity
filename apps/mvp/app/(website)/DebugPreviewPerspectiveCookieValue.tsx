'use client'

import type {LivePerspective} from 'next-sanity/live'

export function DebugPreviewPerspectiveCookieValue({
  data,
  perspective,
}: {
  data: unknown
  perspective: LivePerspective | null
}) {
  return <pre>{JSON.stringify({perspective, data}, null, 2)}</pre>
}
