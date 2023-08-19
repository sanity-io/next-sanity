/* eslint-disable no-process-env */
import type {NextApiRequest, NextApiResponse} from 'next'
import {parseBody} from 'src/webhook'

// export {config} from 'src/webhook'

export default async function revalidate(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<any> {
  try {
    const {body, isValidSignature} = await parseBody(req, process.env.SANITY_REVALIDATE_SECRET)
    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(message, {status: 401})
    }

    if (!body?._type) {
      return new Response('Bad Request', {status: 400})
    }

    await res.revalidate('/')
    return new Response(JSON.stringify({...body, router: 'pages'}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    })
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, {status: 500})
  }
}
