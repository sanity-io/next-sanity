import {defineLive, resolvePerspectiveFromCookies} from 'next-sanity/live'
import {cookies} from 'next/headers'

import {client} from '../sanity.client'
import {DebugPreviewPerspectiveCookieValue} from './DebugPreviewPerspectiveCookieValue'

const token = process.env.SANITY_API_READ_TOKEN!
const {sanityFetch} = defineLive({
  client: client.withConfig({token}),
  serverToken: false,
  browserToken: false,
})

export async function DebugPreviewPerspectiveCookie() {
  'use cache: private'

  const [perspective, {data}] = await Promise.all([
    cookies().then((jar) => resolvePerspectiveFromCookies({cookies: jar})),
    sanityFetch({
      query: `
  *[_type == "system.release"].metadata.title
`,
    }),
  ])

  return <DebugPreviewPerspectiveCookieValue data={data} perspective={perspective} />
}
