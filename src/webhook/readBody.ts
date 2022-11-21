import type {NextApiRequest} from 'next'

/** @internal */
export async function _readBody(readable: NextApiRequest): Promise<string> {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
