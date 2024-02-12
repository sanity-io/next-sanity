## Migrate

### `createClient` now mirrors `@sanity/client` and `sanity`

The `createClient` in `next-sanity` used to re-export `@sanity/preview-kit/client`. Which had different options to handle [stega](https://github.com/sanity-io/client#using-visual-editing-with-steganography).
It also set certain options automatically based on environment variables.

If you relied on the old options for setting stega, here's how to upgrade:

```diff
import {createClient, type FilterDefault} from 'next-sanity'

const encodeSourceMapAtPath: FilterDefault = (props) => {
- if(props.path.at(-1) === 'url') {
+ if(props.sourcePath.at(-1) === 'url') {
    return false
  }
  return props.filterDefault(props)
}

const client = createClient({
  // ... other options like projectId, dataset, etc
- encodeSourceMap: process.env.VERCEL_ENV === 'preview',
- studioUrl: '/studio',
- encodeSourceMapAtPath,
- logger: console,
+ stega: {
+   enabled: process.env.VERCEL_ENV === 'preview',
+   studioUrl: '/studio',
+   filter: encodeSourceMapAtPath,
+   logger: console,
+ }
})
```

If you previously relied on how environment variables were set automatically (the `encodeSourceMap: 'auto'` option), you can replicate the same behavior as before with these options:

```ts
import {createClient} from 'next-sanity'

const client = createClient({
  // ... other options like projectId, dataset, etc
  stega: {
    enabled:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'preview' ||
      process.env.SANITY_SOURCE_MAP === 'true',
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || process.env.SANITY_STUDIO_URL,
  },
})
```

### `parseAppBody` is removed

Use `parseBody` instead:

```diff
import {type NextRequest, NextResponse} from 'next/server'
-import {parseAppBody} from 'next-sanity/webhook'
+import {parseBody} from 'next-sanity/webhook'


export async function POST(req: NextRequest) {
- const {isValidSignature, body} = await parseAppBody(
+ const {isValidSignature, body} = await parseBody(
    req,
    process.env.SANITY_REVALIDATE_SECRET,
  )
}
```

The same is true for the `ParseAppBody` and `ParseBody` types:

```diff
-import type {ParseAppBody} from 'next-sanity/webhook'
-import type {ParseBody} from 'next-sanity/webhook'
+import type {ParsedBody} from 'next-sanity/webhook'
+import type {SanityDocument} from 'next-sanity'

-export async function POST(request: Request): Promise<ParseAppBody> {
-export async function POST(request: Request): Promise<ParseBody> {
+export async function POST(request: Request): Promise<ParsedBody<SanityDocument>> {

}
```
