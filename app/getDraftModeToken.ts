import {draftMode} from 'next/headers'

export function getDraftModeToken(): string | undefined {
  if (!draftMode().isEnabled) {
    return
  }
  // eslint-disable-next-line no-process-env
  const token = process.env.SANITY_API_READ_TOKEN
  if (!token) {
    throw new Error('Missing SANITY_API_READ_TOKEN environment variable')
  }
  // eslint-disable-next-line consistent-return
  return token
}
