'use server'

import {draftMode} from 'next/headers'

export async function disableDraftMode() {
  'use server'
  await Promise.allSettled([
    draftMode().then((handle) => handle.disable()),
    // Simulate a delay to show the loading state
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ])
}
