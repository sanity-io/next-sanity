import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {NextResponse, type NextRequest} from 'next/server'

import {sanitizePerspective} from '#live/sanitizePerspective'

/**
 * Set by `draftMode().enable()` and cleared by `draftMode().disable()`.
 * Its presence is a hint, not proof, that draft mode is on. A forged cookie
 * only changes which `/[perspective]` tree renders, and `sanityFetch` still
 * defaults to `'published'` when Next.js reports draft mode as disabled.
 */
const draftModeCookieName = '__prerender_bypass'

/**
 * `validateApiPerspective` accepts any non-empty string as a release name, so
 * the cookie value is checked against the character set a `[perspective]`
 * route segment may hold before it is spliced into the pathname.
 */
const routeSegmentPattern = /^[A-Za-z0-9_,-]+$/

function resolveRequestSegment(request: NextRequest): string {
  if (!request.cookies.has(draftModeCookieName)) {
    return 'published'
  }
  const cookie = request.cookies.get(perspectiveCookieName)
  if (!cookie) {
    return 'drafts'
  }
  const perspective = sanitizePerspective(cookie.value, 'drafts')
  const segment = Array.isArray(perspective) ? perspective.join(',') : perspective
  return routeSegmentPattern.test(segment) ? segment : 'drafts'
}

/**
 * Creates the `proxy` for an app whose routes live under a `[perspective]`
 * root segment. Every matched request is rewritten from `/x` to
 * `/<perspective>/x`, so the perspective reaches Server Components and
 * `'use cache'` scopes through `next/root-params` instead of cookies.
 *
 * Next.js requires the `matcher` to be a literal in `proxy.ts`, so it stays in
 * the app. Exclude Next.js internals, API routes, the Studio, and static files.
 *
 * @example
 * ```ts
 * // proxy.ts
 * import {definePerspectiveProxy} from 'next-sanity/live/proxy'
 *
 * export const proxy = definePerspectiveProxy()
 *
 * export const config = {
 *   matcher: ['/((?!_next|_vercel|api|studio|favicon|\\.well-known|robots\\.|sitemap\\.|[^/]*\\.).*)?'],
 * }
 * ```
 *
 * @public
 */
export function definePerspectiveProxy(): (request: NextRequest) => NextResponse {
  return function proxy(request) {
    const segment = resolveRequestSegment(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${segment}${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }
}
