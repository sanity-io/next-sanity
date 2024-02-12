import type {SanityDocument} from '@sanity/types'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import type {NextApiRequest} from 'next'
import type {NextRequest} from 'next/server'
import type {PageConfig} from 'next/types'

/**
 * Configurates the API function with the right runtime and body parsing to handle Sanity Webhook events.
 * @public
 * @deprecated using `parseBody` with `NextApiRequest` is deprecated and will be removed in the next major version. Use `parseBody` with `NextRequest` instead from a Route Handler in App Router.
 */
export const config: PageConfig = {
  api: {
    /**
     * Next.js will by default parse the body, which can lead to invalid signatures.
     */
    bodyParser: false,
  },
  runtime: 'nodejs',
}

/** @public */
export type ParsedBody<T> = {
  /**
   * If a secret is given then it returns a boolean. If no secret is provided then no validation is done on the signature, and it'll return `null`
   */
  isValidSignature: boolean | null
  body: T | null
}

/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 */
export async function parseBody<Body = SanityDocument>(
  req: NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency?: boolean,
): Promise<ParsedBody<Body>>
/**
 * Handles parsing the body JSON, and validating its signature. Also waits for Content Lake eventual consistency so you can run your queries
 * without worrying about getting stale data.
 * @public
 * @deprecated using `parseBody` with `NextApiRequest` is deprecated and will be removed in the next major version. Use `parseBody` with `NextRequest` instead from a Route Handler in App Router.
 */
export async function parseBody<Body = SanityDocument>(
  req: NextApiRequest,
  secret?: string,
  waitForContentLakeEventualConsistency?: boolean,
): Promise<ParsedBody<Body>>
// eslint-disable-next-line require-await
export async function parseBody<Body = SanityDocument>(
  req: NextRequest | NextApiRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true,
): Promise<ParsedBody<Body>> {
  return 'text' in req
    ? parseAppBody(req, secret, waitForContentLakeEventualConsistency)
    : parsePageBody(req, secret, waitForContentLakeEventualConsistency)
}

/** @deprecated */
async function parsePageBody<Body = SanityDocument>(
  req: NextApiRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true,
): Promise<ParsedBody<Body>> {
  let signature = req.headers[SIGNATURE_HEADER_NAME]
  if (Array.isArray(signature)) {
    signature = signature[0]
  }
  if (!signature) {
    console.error('Missing signature header')
    return {body: null, isValidSignature: null}
  }

  if (req.readableEnded) {
    throw new Error(
      `Request already ended and the POST body can't be read. Have you setup \`export {config} from 'next-sanity/webhook' in your webhook API handler?\``,
    )
  }

  const body = await readBody(req)
  const validSignature = secret ? await isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    body: body.trim() ? JSON.parse(body) : null,
    isValidSignature: validSignature,
  }
}

async function parseAppBody<Body = SanityDocument>(
  req: NextRequest,
  secret?: string,
  waitForContentLakeEventualConsistency: boolean = true,
): Promise<ParsedBody<Body>> {
  const signature = req.headers.get(SIGNATURE_HEADER_NAME)!
  if (!signature) {
    console.error('Missing signature header')
    return {body: null, isValidSignature: null}
  }

  const body = await req.text()
  const validSignature = secret ? await isValidSignature(body, signature, secret.trim()) : null

  if (validSignature !== false && waitForContentLakeEventualConsistency) {
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return {
    body: body.trim() ? JSON.parse(body) : null,
    isValidSignature: validSignature,
  }
}

async function readBody(readable: NextApiRequest): Promise<string> {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
