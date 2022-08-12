import type {NextApiRequest, NextApiResponse} from 'next'

// eslint-disable-next-line require-await
export default async function exit(_: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Exit the current user from "Preview Mode". This function accepts no args.
  res.clearPreviewData()

  // Redirect the user back to the index page.
  res.writeHead(307, {Location: '/'})
  res.end()
}
