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

  // Enable Preview Mode by setting the cookies
  res.setPreviewData({
    title: 'Preview Mode: Cookie',
    description:
      "Requires the user to be authenticated to the Studio, and allow cross-origin cookies (Safari doesn't)",
    authMode: null,
    token: null,
  })
  res.writeHead(307, {Location: '/'})
  res.end()
}
