## Migrate

### Next v14 is required

You'll need to upgrade to Next v14 to use `next-sanity` v6.

### Viewport metadata changed in Next v14

If you're embedding a `sanity` studio, you'll need to add the new `viewport` export where you're currently exporting `metadata` with App Router:

```diff
export {metadata} from 'next-sanity/studio/metadata'
+export {viewport} from 'next-sanity/studio/viewport'
```

For Pages Router:

```diff
// ./pages/studio/[[...index]].tsx
import Head from 'next/head'
import {NextStudio} from 'next-sanity/studio'
import {metadata} from 'next-sanity/studio/metadata'

import config from '../../sanity.config'

export default function StudioPage() {
  return (
    <>
      <Head>
        {Object.entries(metadata).map(([key, value]) => (
          <meta key={key} name={key} content={value} />
        ))}
+        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
      </Head>
      <NextStudio config={config} />
    </>
  )
}
```

### Embedded Studios should be mounted by the App Router

If you're currently mounting the Studio on a Pages Router route, you should move to an [App Router route instead.](https://github.com/sanity-io/next-sanity?tab=readme-ov-file#studio-route-with-app-router)
You don't have to migrate the rest of your routes to App Router, just the one that mounts the Studio.
