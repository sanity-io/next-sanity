---
"next-sanity": major
---

feat(studio)!: remove the `next-sanity/studio` and `next-sanity/studio/client-component` entry points

`next-sanity` no longer wraps Sanity Studio. Import `Studio` from `sanity` directly and mount it at a route in your app. Removed from the package:

- `NextStudio`, `NextStudioProps`, `NextStudioLayout`, `NextStudioNoScript`, `metadata`, and `viewport` from `next-sanity/studio`
- `NextStudio` and `NextStudioProps` from `next-sanity/studio/client-component`
- the `history` dependency and the `sanity` peer dependency, which only these entry points used; `styled-components` stays a peer dependency because `@sanity/visual-editing` requires it

Install `sanity` yourself if it is not already in your app:

```bash
npm install sanity
```

Before:

```tsx
// app/studio/[[...tool]]/page.tsx
"use client"

import {NextStudio} from "next-sanity/studio"

import config from "@/sanity.config"

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

```tsx
// app/studio/[[...tool]]/layout.tsx
export {metadata, viewport} from "next-sanity/studio"
```

After, following the [Embedded Sanity Studio](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs) guide, where the catch-all segment matches `basePath` in `sanity.config.ts`:

```tsx
// app/studio/[[...tool]]/page.tsx
"use client"

import {Studio} from "sanity"

import config from "@/sanity.config"

export default function StudioPage() {
  return <Studio config={config} />
}
```

```tsx
// app/studio/[[...tool]]/layout.tsx
import type {Metadata, Viewport} from "next"

export const metadata: Metadata = {referrer: "same-origin", robots: "noindex"}
export const viewport: Viewport = {width: "device-width", initialScale: 1, viewportFit: "cover"}

export default function StudioLayout({children}: {children: React.ReactNode}) {
  return children
}
```

If you passed `history="hash"`, for example because your app is a static export and cannot serve a catch-all route, pass a hash history from the `history` package to `unstable_history` and render the Studio in the browser only:

```bash
npm install history
```

```tsx
// app/studio/Studio.tsx
"use client"

import {createHashHistory} from "history"
import {Studio} from "sanity"

import config from "@/sanity.config"

const history = createHashHistory()

export default function StudioClient() {
  return <Studio config={config} unstable_history={history} unstable_globalStyles />
}
```

```tsx
// app/studio/page.tsx
"use client"

import dynamic from "next/dynamic"

const Studio = dynamic(() => import("./Studio"), {ssr: false})

export default function StudioPage() {
  return <Studio />
}
```

`NextStudio` also rendered a full-viewport wrapper, a `<noscript>` notice, and passed `unstable_globalStyles`. `Studio` from `sanity` fills its container, so wrap it in an element sized to the viewport if your layout does not already do that, and add a `<noscript>` element yourself if you want one.
