'use client'

// Re-exported in a `use client` file to make components able to rerender on the client
// that are otherwise only rendered on the server.
// Wrapping them in next/dynamic ensures their JS isn't in the client bundle unless
// draftMode is enabled.

import dynamic from 'next/dynamic'

export const PreviewPostsLayout = dynamic(() => import('@/app/PostsLayout'))
