## Migrate

### Minimum required `@sanity/ui` is now `2.0.11`

Upgrade to the latest v2 stable using the following command:

```bash
npm install @sanity/ui@latest --save-exact
```

### Minumum required `styled-components` is now `6.1.0`

Upgrade using:

```bash
npm install styled-components@^6.1.0
```

And make sure to remove `@types/styled-components` as `styled-components` now ship with its own types:

```bash
npm uninstall @types/styled-components
```

You can also remove `react-is` from your dependencies, unless you're using them in your own code.

### The deprecated export `next-sanity/studio/metadata` has been removed

Use the `metadata` export from `next-sanity/studio` instead:

```diff
-export {metadata} from 'next-sanity/studio/metadata'
+export {metadata} from 'next-sanity/studio'
```

### The deprecated export `next-sanity/studio/viewport` has been removed

Use the `viewport` export from `next-sanity/studio` instead:

```diff
-export {viewport} from 'next-sanity/studio/viewport'
+export {viewport} from 'next-sanity/studio'
```

### The `next-sanity/webhook` feature is now App Router only

If possible you should migrate your [Pages Router API Route](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) to be an [App Router Route Handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers).

If you were using the webhook to perform [On-Demand Revalidation of ISR](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration#using-on-demand-revalidation) on Pages Router then you can't simply migrate to App Router, and will instead need to migrate to using `@sanity/webhook` directly:

```bash
npm install @sanity/webhook@4.0.2-bc --save-exact
```

```diff
// ./pages/api/revalidate.ts

-import { parseBody, type ParsedBody } from 'next-sanity/webhook'
+import type { ParsedBody } from 'next-sanity/webhook'
+import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
+import type { PageConfig } from 'next/types'


-export { config } from 'next-sanity/webhook'
+export const config = {
+  api: {
+    /**
+     * Next.js will by default parse the body, which can lead to invalid signatures.
+     */
+    bodyParser: false,
+  },
+  runtime: 'nodejs',
+} satisfies PageConfig

export default async function revalidate(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { body, isValidSignature } = await parseBody(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    )
    if (!isValidSignature) {
      const message = 'Invalid signature'
      console.log(message)
      return res.status(401).send(message)
    }
    if (typeof body?._id !== 'string' || !body?._id) {
      const invalidId = 'Invalid _id'
      console.error(invalidId, { body })
      return res.status(400).send(invalidId)
    }
    const staleRoutes = await queryStaleRoutes(body as any)
    await Promise.all(staleRoutes.map((route) => res.revalidate(route)))
    const updatedRoutes = `Updated routes: ${staleRoutes.join(', ')}`
    console.log(updatedRoutes)
    return res.status(200).send(updatedRoutes)
  } catch (err) {
    console.error(err)
    return res.status(500).send(err.message)
  }
}

+async function parseBody<Body = SanityDocument>(
+  req: NextApiRequest,
+  secret?: string,
+  waitForContentLakeEventualConsistency: boolean = true,
+): Promise<ParsedBody<Body>> {
+  let signature = req.headers[SIGNATURE_HEADER_NAME]
+  if (Array.isArray(signature)) {
+    signature = signature[0]
+  }
+  if (!signature) {
+    console.error('Missing signature header')
+    return { body: null, isValidSignature: null }
+  }
+
+  if (req.readableEnded) {
+    throw new Error(
+      `Request already ended and the POST body can't be read. Have you setup \`export {config} from 'next-sanity/webhook' in your webhook API handler?\``,
+    )
+  }
+
+  const body = await readBody(req)
+  const validSignature = secret
+    ? await isValidSignature(body, signature, secret.trim())
+    : null
+
+  if (validSignature !== false && waitForContentLakeEventualConsistency) {
+    await new Promise((resolve) => setTimeout(resolve, 1000))
+  }
+
+  return {
+    body: body.trim() ? JSON.parse(body) : null,
+    isValidSignature: validSignature,
+  }
+}
+
+async function readBody(readable: NextApiRequest): Promise<string> {
+  const chunks = []
+  for await (const chunk of readable) {
+    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
+  }
+  return Buffer.concat(chunks).toString('utf8')
+}
```

[Here's a complete example of such a migration.](https://github.com/sanity-io/nextjs-blog-cms-sanity-v3/commit/3eed62b7d42b8b90f8dad1917831013626065ac2)
