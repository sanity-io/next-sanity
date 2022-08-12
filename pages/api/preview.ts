/* eslint-disable no-process-env */

export default async function preview(req, res) {
  const secret = process.env.NEXT_PUBLIC_PREVIEW_SECRET
  // Only require a secret when in production
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new TypeError(`Missing NEXT_PUBLIC_PREVIEW_SECRET`)
  }
  // Check the secret if it's provided, enables running preview mode locally before the env var is setup
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({message: 'Invalid secret'})
  }

  const token = process.env.SANITY_API_PREVIEW_TOKEN
  if (!token) {
    throw new TypeError(`Missing SANITY_API_PREVIEW_TOKEN`)
  }

  // Enable Preview Mode by setting the cookies
  res.setPreviewData({
    title: 'Preview Mode: Dual',
    description:
      'Attempst to use cookie auth first to avoid loading the EventSource polyfill, if it fails it tries the token',
    authMode: 'dual',
    token,
  })
  res.writeHead(307, {Location: '/'})
  res.end()
}
