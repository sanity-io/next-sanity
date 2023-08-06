import type {NextApiRequest, NextApiResponse} from 'next'
import {parseBody} from 'src/webhook'

export {config} from 'src/webhook'

export default async function revalidate(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<any> {
  try {
    const {body, isValidSignature} = await parseBody(req, process.env.SANITY_REVALIDATE_SECRET)
    if (isValidSignature === false) {
      const message = 'Invalid signature'
      return res.status(401).send(message)
    }

    if (!body._type) {
      return res.status(400).send('Bad Request')
    }

    await res.revalidate('/')
    return res.status(200).json(body)
  } catch (err: any) {
    console.error(err)
    return res.status(500).send(err.message)
  }
}
