# next-sanity

[Sanity.io](https://www.sanity.io/?utm_source=github&utm_medium=readme&utm_campaign=next-sanity) toolkit for Next.js.

**Features:**

- Client-side live real-time preview for authenticated users
- Light-weight client for fetching data
- URL-helper for Sanity’s image pipeline
- Rich-text component for Portable Text
- GROQ syntax highlighting

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Live real-time preview](#live-real-time-preview)
  - [Limits](#limits)
- [Usage](#usage)
- [Example: Minimal blog post template](#example-minimal-blog-post-template)
- [License](#license)

## Installation

```sh
$ npm install next-sanity
// or
$ yarn add next-sanity
```

## Live real-time preview

You can implement real-time client side preview using `createPreviewSubscriptionHook`. It works by streaming the whole dataset to the browser, which it keeps updated using [listeners](https://www.sanity.io/docs/realtime-updates) and Mendoza patches. When it recieves updates, then the query is run against the client-side datastore using [groq-js](https://github.com/sanity-io/groq-js). This only happens if you're logged in and the hook is configured to run, which means you can use this code in production.

You might want to use Vercel’s approach to previews, which is set up with a serverless functions that takes a preview secret, which in turn redirects you to a page with a `preview` prop set to `true`.

### Limits

The real-time preview isn't optimized and comes with a configured limit of 3000 documents. You can experiment with larger datasets by configuring the hook with `documentLimit: <Integer>`. Be aware that this might significantly affect the preview performance.

We have plans for optimizations in the roadmap.


## Usage

It’s practical to set up a decicated file where you import and set up your client etc. Below is a comprehensive example of the different things you can set up.

```js
// lib/sanity.js
import {
  groq,
  createClient,
  createImageUrlBuilder,
  createPortableTextComponent,
  createPreviewSubscriptionHook,
  createCurrentUserHook,
} from 'next-sanity'

const config = {
  /**
    * Find your project ID and dataset in `sanity.json` in your studio project.
    * These are considered “public”, but you can use environment variables
    * if you want differ between local dev and production.
    *
    * https://nextjs.org/docs/basic-features/environment-variables
    **/
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  useCdn: process.env.NODE_ENV === 'production',
  /**
    * Set useCdn to `false` if your application require the freshest possible
    * data always (potentially slightly slower and a bit more expensive).
    * Authenticated request (like preview) will always bypass the CDN
    **/
}

/**
 * Set up a helper function for generating Image URLs with only the asset reference data in your documents.
 * Read more: https://www.sanity.io/docs/image-url
 **/
export const urlFor = source => createImageUrlBuilder(config).image(source)

// Set up the live preview subscription hook
export const usePreviewSubscription = createPreviewSubscriptionHook(config)

// Set up Portable Text serialization
export const PortableText = createPortableTextComponent({
  ...config,
  // Serializers passed to @sanity/block-content-to-react
  // (https://github.com/sanity-io/block-content-to-react)
  serializers: {},
})

// Set up the client for fetching data in the getProps page functions
export const sanityClient = createClient(config)
// Set up a preview client with serverless authentication for drafts
export const previewClient = createClient({
  ...config,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Helper function for easily switching between normal client and preview client
export const getClient = (usePreview) => (usePreview ? previewClient : sanityClient)

// Helper function for using the current logged in user account
export const useCurrentUser = createCurrentUserHook(config)
```

## Example: Minimal blog post template

A minimal example for a blog post template using the schema from from the Sanity Studio blog example. Includes the real-time preview using the configuration illustrated above:

```jsx
// pages/posts/[slug].js
import ErrorPage from 'next/error'
import {useRouter} from 'next/router'
import {groq} from 'next-sanity'
import {
  getClient,
  usePreviewSubscription,
  urlFor,
  PortableText
  } from '../../lib/sanity'

const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    body,
    mainImage,
    categories[]->{
      _id,
      title
    },
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

  const {title, mainImage, body} = post

  return (
    <article>
      <h2>{title}</h2>
      <figure>
        <img src={urlFor(mainImage).url()} />
      </figure>
      <PortableText blocks={body} />
      <aside>

      </aside>
    </article>
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

## License

MIT-licensed. See LICENSE.
