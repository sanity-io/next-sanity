import {
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
  type LivePerspective,
} from 'next-sanity/live'
import type {cookies} from 'next/headers'

export const defaultPreviewCookies: {perspective: LivePerspective; variant: string | undefined} = {
  perspective: 'published',
  variant: undefined,
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
