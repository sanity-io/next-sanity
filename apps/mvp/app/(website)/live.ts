import {defineLive} from 'next-sanity/live'

import {client} from '@/app/sanity.client'

const token = process.env.SANITY_API_READ_TOKEN!

export const {fetch, Live} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
