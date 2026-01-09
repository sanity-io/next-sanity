import type {NextConfig} from 'next'

import {sanity} from 'next-sanity/cache-life'

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true
  },
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  cacheComponents: true,
  cacheLife: {sanity},
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
}

export default nextConfig
