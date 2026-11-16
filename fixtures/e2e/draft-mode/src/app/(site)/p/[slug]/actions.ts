'use server'

import {draftMode} from 'next/headers'

export async function toggleDraftMode() {
  const draft = await draftMode()
  if (draft.isEnabled) {
    draft.disable()
  } else {
    draft.enable()
  }
}
