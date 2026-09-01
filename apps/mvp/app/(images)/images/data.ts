import {groq} from 'next-sanity'

import {client} from '@/app/sanity.client'

/**
 * The shape `mainImage{asset, crop, hotspot, alt}` projections return.
 * Assignable to the `src` prop of `next-sanity/image` as-is.
 */
export interface DemoImage {
  asset: {_ref: string; _type: 'reference'} | null
  crop: {
    top?: number | null
    bottom?: number | null
    left?: number | null
    right?: number | null
  } | null
  hotspot: {
    x?: number | null
    y?: number | null
    width?: number | null
    height?: number | null
  } | null
  alt?: string | null
}

export interface DemoPost {
  title: string | null
  image: DemoImage | null
}

/**
 * The latest post with an image: in the demo dataset that's a movie poster
 * with a hotspot and crop set in the Studio.
 */
export async function getHeroPost(): Promise<DemoPost | null> {
  'use cache'
  return client.fetch<DemoPost | null>(
    groq`*[_type == "post" && defined(mainImage.asset) && defined(mainImage.hotspot)] | order(publishedAt desc)[0]{
      title,
      "image": mainImage{asset, crop, hotspot, alt}
    }`,
  )
}

export interface DemoMovie {
  title: string | null
  poster: DemoImage | null
}

/**
 * Movie posters from the classic Sanity movies dataset, for grid demos.
 */
export async function getMovies(count: number): Promise<DemoMovie[]> {
  'use cache'
  return client.fetch<DemoMovie[]>(
    groq`*[_type == "movie" && defined(poster.asset)] | order(title asc)[0...$count]{
      title,
      poster{asset, crop, hotspot}
    }`,
    {count},
  )
}

export interface DemoAsset {
  _id: string
  url: string | null
  lqip: string | null
  /** The dominant background color from the image palette, e.g. `#cd997c` */
  paletteBackground: string | null
  width: number | null
  height: number | null
}

/**
 * Image assets that have a low-quality image preview (LQIP) and palette in
 * their metadata, for the placeholder demos.
 */
export async function getAssetsWithMetadata(): Promise<DemoAsset[]> {
  'use cache'
  return client.fetch<DemoAsset[]>(
    groq`*[_type == "sanity.imageAsset" && defined(metadata.lqip)] | order(metadata.dimensions.width desc)[0...3]{
      _id,
      url,
      "lqip": metadata.lqip,
      "paletteBackground": metadata.palette.dominant.background,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height
    }`,
  )
}
