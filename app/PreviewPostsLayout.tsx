'use client'

import dynamic from 'next/dynamic'

// Re-exporting in a file with `use client` ensures the layout stays server-only
// when we're not in preview mode.

// export {default} from './PostsLayout'

// const PostsLayoutLazy = dynamic(() => import('./PostsLayout'))
// export default PostsLayoutLazy

export default dynamic(() => import('./PostsLayout'))
