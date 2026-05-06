---
'next-sanity': patch
---

fix(deps): update dependency @portabletext/react to ^6.2.0

### TypeGen-aware Portable Text components

`<PortableText>` now infers the shape of every component handler from the `value` prop. When you pass a value typed by [Sanity TypeGen](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen), `components.types`, `components.marks`, `components.block`, `components.list`, and `components.listItem` all receive precise `value` props for the exact content the query returned.

Three new utility types ship with this feature:

- `InferComponents<T>` - same inference as the inline `components` prop, for hoisting components out of JSX.
- `InferStrictComponents<T>` - strict variant that requires a handler for every inferred custom type, mark, block style, and list style, and rejects handlers that aren't in the schema (and therefore not visible to TypeGen).
- `InferValue<T>` - derives a Portable Text array value type from any TypeGen query result type, useful for re-usable wrapper components.

#### Schema

Every example below assumes the same `sanity.config.ts`:

```ts
// sanity.config.ts
'use client'
import {defineArrayMember, defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  name: 'default',
  projectId: 'abc123',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'post',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({
            name: 'content',
            type: 'array',
            of: [
              defineArrayMember({type: 'block'}),
              defineArrayMember({
                type: 'image',
                options: {hotspot: true},
                fields: [defineField({name: 'alt', type: 'string'})],
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
```

#### Before: hand-typing handlers

Previously, every handler had to be typed by hand to mirror the generated query shape:

```tsx
// app/[slug]/page.tsx
import {createImageUrlBuilder} from '@sanity/image-url'
import {createClient, defineQuery, defineLive, PortableText} from 'next-sanity'
import {Image} from 'next-sanity/image'
import {notFound} from 'next/navigation'

const client = createClient({
  projectId: 'abc123',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2026-05-04',
})
const builder = createImageUrlBuilder(client)
const {sanityFetch} = defineLive({client})

export default async function Page({params}: PageProps<'/[slug]'>) {
  const {slug} = await params
  const query = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title,content}`)
  const {data} = await sanityFetch({query, params: {slug}})

  if (!data) return notFound()

  return (
    <article>
      <h1>{data.title}</h1>
      <PortableText
        components={{
          types: {
            image: ({
              value,
            }: {
              value: {
                asset?: {
                  _ref: string
                  _type: 'reference'
                  _weak?: boolean
                }
                hotspot?: {
                  _type: 'sanity.imageHotspot'
                  x?: number
                  y?: number
                  height?: number
                  width?: number
                }
                crop?: {
                  _type: 'sanity.imageCrop'
                  top?: number
                  bottom?: number
                  left?: number
                  right?: number
                }
                alt?: string
                _type: 'image'
                _key: string
              }
            }) => (
              <Image
                src={builder.image(value).url()}
                alt={value.alt || ''}
                fill
                sizes="100vw"
                style={{objectFit: 'cover'}}
              />
            ),
          },
        }}
        value={data.content}
      />
    </article>
  )
}
```

#### After: automatic inference

Now the same handler is fully typed straight from `data.content`:

```tsx
// app/[slug]/page.tsx
import {createImageUrlBuilder} from '@sanity/image-url'
import {createClient, defineQuery, defineLive, PortableText} from 'next-sanity'
import {Image} from 'next-sanity/image'
import {notFound} from 'next/navigation'

const client = createClient({
  projectId: 'abc123',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2026-05-04',
})
const builder = createImageUrlBuilder(client)
const {sanityFetch} = defineLive({client})

export default async function Page({params}: PageProps<'/[slug]'>) {
  const {slug} = await params
  const query = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title,content}`)
  const {data} = await sanityFetch({query, params: {slug}})

  if (!data) return notFound()

  return (
    <article>
      <h1>{data.title}</h1>
      <PortableText
        components={{
          types: {
            // value is fully typed from the query result, no annotation needed
            image: ({value}) => (
              <Image
                src={builder.image(value).url()}
                alt={value.alt || ''}
                fill
                sizes="100vw"
                style={{objectFit: 'cover'}}
              />
            ),
          },
        }}
        value={data.content}
      />
    </article>
  )
}
```

#### `InferComponents`: hoisting components without losing inference

Move the `components` map out of JSX and keep the same inferred handler types:

```tsx
// app/[slug]/page.tsx
import {createImageUrlBuilder} from '@sanity/image-url'
import {
  createClient,
  defineQuery,
  defineLive,
  PortableText,
  type InferComponents,
} from 'next-sanity'
import {Image} from 'next-sanity/image'
import {notFound} from 'next/navigation'

const client = createClient({
  projectId: 'abc123',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2026-05-04',
})
const builder = createImageUrlBuilder(client)
const {sanityFetch} = defineLive({client})

export default async function Page({params}: PageProps<'/[slug]'>) {
  const {slug} = await params
  const query = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title,content}`)
  const {data} = await sanityFetch({query, params: {slug}})

  if (!data) return notFound()

  const components = {
    types: {
      image: ({value}) => (
        <Image
          src={builder.image(value).url()}
          alt={value.alt || ''}
          fill
          sizes="100vw"
          style={{objectFit: 'cover'}}
        />
      ),
    },
  } satisfies InferComponents<typeof data.content>

  return (
    <article>
      <h1>{data.title}</h1>
      <PortableText components={components} value={data.content} />
    </article>
  )
}
```

#### `InferStrictComponents` + `InferValue`: a strict, re-usable wrapper

`InferValue<SanityQueries[keyof SanityQueries]>` collects every Portable Text item shape from every registered TypeGen query into an array value type, and `InferStrictComponents` requires a handler for each of them. Together they're perfect for a single `CustomPortableText` you reuse across the app:

```tsx
// app/[slug]/page.tsx
import {createImageUrlBuilder} from '@sanity/image-url'
import {
  createClient,
  defineQuery,
  defineLive,
  PortableText,
  type SanityQueries,
  type InferValue,
  type InferStrictComponents,
} from 'next-sanity'
import {Image} from 'next-sanity/image'
import {notFound} from 'next/navigation'

const client = createClient({
  projectId: 'abc123',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2026-05-04',
})
const builder = createImageUrlBuilder(client)
const {sanityFetch} = defineLive({client})

function CustomPortableText({
  value,
}: {
  // Array value type for every Portable Text item shape across all registered queries.
  value: InferValue<SanityQueries[keyof SanityQueries]>
}) {
  const components = {
    types: {
      image: ({value}) => <img src={builder.image(value).url()} alt={value.alt || ''} />,
    },
  } satisfies InferStrictComponents<typeof value>
  //   ^ TypeScript errors when the schema gains a custom type, mark, or list
  //     style without a matching handler defined here

  return <PortableText components={components} value={value} />
}

export default async function Page({params}: PageProps<'/[slug]'>) {
  const {slug} = await params
  const query = defineQuery(`*[_type == "post" && slug.current == $slug][0]{title,content}`)
  const {data} = await sanityFetch({query, params: {slug}})

  if (!data) return notFound()

  return (
    <article>
      <h1>{data.title}</h1>
      {Array.isArray(data.content) && <CustomPortableText value={data.content} />}
    </article>
  )
}
```
