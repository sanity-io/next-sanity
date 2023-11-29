## Migrate

### `LiveQueryProvider` is now already lazy loaded

If you previously imported it like this:

```tsx
'use client'

import dynamic from 'next/dynamic'
const LiveQueryProvider = dynamic(() => import('next-sanity/preview'))
// or like this:
import {lazy} from 'react'
const LiveQueryProvider = lazy(() => import('next-sanity/preview'))
```

Then you should now import it like this:

```tsx
'use client'

import {LiveQueryProvider} from 'next-sanity/preview'
```

Otherwise you'll see an error like this:

```
Error: Element type is invalid. Received a promise that resolves to: [object Object]. Lazy element type must resolve to a class or function. Did you wrap a component in React.lazy() more than once?
```

### The deprecated `next-sanity/studio/head` export has been removed

Migrate to using `export {metadata} from 'next-sanity/studio/metadata'` and `export {viewport} from 'next-sanity/studio/viewport'` in your `page.tsx` instead.
