import {prerender} from 'react-dom/static'

export const projectId = 'pv8y60vp'
export const dataset = 'production'
export const apiVersion = '2026-05-12'
export const stega = {studioUrl: '/studio'}

export async function renderToString(app: React.JSX.Element) {
  const {prelude} = await prerender(app)

  const reader = prelude.getReader()
  let content = ''
  while (true) {
    // oxlint-disable-next-line no-await-in-loop
    const {done, value} = await reader.read()
    if (done) {
      return content
    }
    content += Buffer.from(value).toString('utf8')
  }
}
