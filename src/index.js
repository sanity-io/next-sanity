import Link from 'next/link'
import { client, usePreview } from '@next/sanity'

const query = groq`
  *[_type == 'product' && slug.current == $slug]{
    title,
    description,
    price,
    relatedProducts: *[_type == 'product' && references(^._id)]{
      _id,
      title,
      slug
    }
  }
`

function ProductPage({ data, slug, preview }) {
  const { title, description, price, relatedProducts } = preview
    ? usePreview(query, {slug})
    : data

  return (
    <article>
      <h2>
        {title} – ${price}
      </h2>
      <p>{description}</p>
      <ul>
        Related products:
        {relatedProducts.map(product => (
          <li key={product._id}>
            <Link href={product?.slug?.current}>{product.title}</Link>
          </li>
        ))}
      </ul>
    </article>
  )
}

export async function getStaticProps({ params, preview = false }) {
  const {slug} = params
  const data = await client.fetch(query, {slug})
  return {
    props: {
      preview,
      slug,
      data
    },
  }
}

export async function getStaticPaths() {
  const allProducts = await client.fetch(`*[_type == "product" && defined(slug.current)]{"params": {"slug": slug.current}}`)
  return {
    paths: allProducts,
    fallback: true,
  }
}
