import type {Metadata} from 'next'

import {metadata as _metadata} from './head'

/**
 * @public
 * @deprecated use `export {metadata} from 'next-sanity/studio'` instead
 */
export const metadata = _metadata satisfies Metadata
