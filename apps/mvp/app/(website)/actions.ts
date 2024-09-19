'use server'

import {draftMode} from 'next/headers'

import {verifyPreviewSecret} from './live'

export async function handleDraftModeAction(secret: string): Promise<void | string> {
  console.log('Server Action wants to enable Draft Mode', {secret})

  if ((await draftMode()).isEnabled) {
    // eslint-disable-next-line no-console
    console.log('Draft Mode is already enabled')
    return
  }

  try {
    const {isValid} = await verifyPreviewSecret(secret)

    if (!isValid) {
      return 'Invalid secret provided'
    }

    console.log('Enabling Draft Mode')
    ;(await draftMode()).enable()
  } catch (err) {
    console.error('Failed to verify preview secret', {secret}, err)
    return 'Unexpected error'
  }
}

export async function disableDraftMode() {
  'use server'
  await Promise.allSettled([
    (await draftMode()).disable(),
    // Simulate a delay to show the loading state
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ])
}
