// A minimal stand-in for the Sanity APIs next-sanity talks to during draft mode:
// GROQ queries (with Content Source Maps), preview URL secrets and Live events.
import http from 'node:http'

export const VALID_SECRET = 'valid-secret'

function sourceMap() {
  return {
    documents: [{_id: 'post', _type: 'post'}],
    paths: ["$['title']"],
    mappings: {
      "$['title']": {source: {document: 0, path: 0, type: 'documentValue'}, type: 'value'},
    },
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * Titles are `<published|draft title> (<slug>)` so tests can tell both the perspective and the page apart.
 */
export async function startMockSanity(port) {
  const state = {published: 'Published v1', draft: 'Draft v1'}
  const liveClients = new Set()

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin
    if (origin) {
      res.setHeader('access-control-allow-origin', origin)
      res.setHeader('access-control-allow-credentials', 'true')
      res.setHeader('access-control-allow-headers', 'authorization, content-type, last-event-id')
      res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
    }
    if (req.method === 'OPTIONS') return res.end()

    const url = new URL(req.url, 'http://localhost')
    const json = (body, status = 200) => {
      res.writeHead(status, {'content-type': 'application/json'})
      res.end(JSON.stringify(body))
    }

    if (/^\/v[^/]+\/data\/live\/events\//.test(url.pathname)) {
      res.writeHead(200, {'content-type': 'text/event-stream', 'cache-control': 'no-cache'})
      res.write('event: welcome\ndata: {}\n\n')
      liveClients.add(res)
      req.on('close', () => liveClients.delete(res))
      return
    }

    if (/^\/v[^/]+\/data\/query\//.test(url.pathname)) {
      let query = url.searchParams.get('query')
      const params = {}
      for (const [key, value] of url.searchParams) {
        if (key.startsWith('$')) params[key.slice(1)] = JSON.parse(value)
      }
      if (req.method === 'POST') {
        const body = JSON.parse((await readBody(req)) || '{}')
        query = body.query
        Object.assign(params, body.params)
      }

      if (query?.includes('sanity.previewUrlSecret')) {
        const valid = params.secret === VALID_SECRET
        return json({
          ms: 1,
          result: {
            private: valid
              ? {
                  _id: 'secret',
                  _updatedAt: new Date().toISOString(),
                  secret: params.secret,
                  studioUrl: '/presentation',
                }
              : null,
            public: null,
          },
        })
      }

      const perspective = url.searchParams.get('perspective') || 'raw'
      const isDraft = perspective !== 'published' && perspective !== 'raw'
      const title = `${isDraft ? state.draft : state.published} (${params.slug})`
      return json({
        ms: 1,
        query,
        result: {_id: isDraft ? 'drafts.post' : 'post', _type: 'post', title},
        resultSourceMap: url.searchParams.get('resultSourceMap') ? sourceMap() : undefined,
        syncTags: ['s1:post'],
      })
    }

    res.writeHead(404)
    res.end()
  })

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve))

  return {
    state,
    reset() {
      state.published = 'Published v1'
      state.draft = 'Draft v1'
    },
    emit(tags) {
      const id = String(Date.now())
      for (const client of liveClients) {
        client.write(`event: message\nid: ${id}\ndata: ${JSON.stringify({id, tags})}\n\n`)
      }
      return liveClients.size
    },
    async close() {
      for (const client of liveClients) client.end()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}
