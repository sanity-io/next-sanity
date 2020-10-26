# next-sanity

Sanity.io toolkit for Next.js

## Installing

```sh
$ npm install next-sanity
```

## Usage

In some file, eg `lib/sanity.js`:

```js
import {
  groq,
  createClient,
  createImageUrlBuilder,
  createPortableTextComponent,
  createPreviewSubscriptionHook,
} from 'next-sanity'

const config = {
  // Find your project ID and dataset in `sanity.json` in your studio project
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  useCdn: process.env.NODE_ENV === 'production',
  // useCdn == true gives fast, cheap responses using a globally distributed cache.
  // Set this to false if your application require the freshest possible
  // data always (potentially slightly slower and a bit more expensive).
}

export const imageUrlBuilder = createImageUrlBuilder(config)
export const usePreviewSubscription = createPreviewSubscriptionHook(config)
export const sanityClient = createClient(config)
export const previewClient = createClient({
  ...config,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

export const getClient = (usePreview) => (usePreview ? previewClient : sanityClient)
export const PortableText = createPortableTextComponent({
  ...config,

  // Serializers passed to @sanity/block-content-to-react
  // (https://github.com/sanity-io/block-content-to-react)
  serializers: {},
})
```

In a page component, eg `pages/posts/[slug].js`:

```js
import ErrorPage from 'next/error'
import {useRouter} from 'next/router'
import {groq} from 'next-sanity'
import {getClient, PortableText, usePreviewSubscription} from '../../lib/sanity'

const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    excerpt,
    content,
    coverImage,
    "slug": slug.current
  }
`

export default function Post({data, preview}) {
  const router = useRouter()
  if (!router.isFallback && !data.post?.slug) {
    return <ErrorPage statusCode={404} />
  }

  const {data: post} = usePreviewSubscription(postQuery, {
    params: {slug: data.post.slug},
    initialData: data,
    enabled: preview,
  })

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <div>
        <PortableText blocks={post.content || []} />
      </div>
    </div>
  )
}

export async function getStaticProps({params, preview = false}) {
  const post = await getClient(preview).fetch(postQuery, {
    slug: params.slug,
  })

  return {
    props: {
      preview,
      data: {post},
    },
  }
}

export async function getStaticPaths() {
  const paths = await getClient().fetch(
    groq`*[_type == "post" && defined(slug.current)][].slug.current`
  )

  return {
    paths: paths.map((slug) => ({params: {slug}})),
    fallback: true,
  }
}
```

## Documentation

@todo

## License

MIT-licensed. See LICENSE.
