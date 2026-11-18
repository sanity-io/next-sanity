import {defineEnableDraftMode} from 'next-sanity/draft-mode'

import {client} from '../../../sanity'

export const {GET} = defineEnableDraftMode({
  client: client.withConfig({token: 'server-token'}),
  // Chromium treats http://localhost as a secure context, so `next dev` can exercise SameSite=None cookies too
  secureDevMode: true,
})
