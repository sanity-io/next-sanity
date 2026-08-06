import {
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
  type LivePerspective,
} from 'next-sanity/live'
import {cookies, draftMode} from 'next/headers'

export interface DynamicFetchOptions {
  perspective: LivePerspective
  variant?: string
  // `boolean` brands `sanityFetch` `data`; use literal `false` for clean types
  stega: boolean
}

export async function resolvePreviewCookies(jar: Awaited<ReturnType<typeof cookies>>): Promise<{
  perspective: LivePerspective
  variant: string | undefined
}> {
  const [perspective, variant] = await Promise.all([
    resolvePerspectiveFromCookies({cookies: jar}),
    resolveVariantFromCookies({cookies: jar}),
  ])

  return {perspective, variant}
}

// Resolve dynamic values outside 'use cache' boundaries.
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const {isEnabled: isDraftMode} = await draftMode()
  if (!isDraftMode) {
    return {perspective: 'published', stega: false}
  }

  const jar = await cookies()
  const {perspective, variant} = await resolvePreviewCookies(jar)
  return {perspective, variant, stega: true}
}
