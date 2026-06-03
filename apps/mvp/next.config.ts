import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  cacheComponents: true,
  cacheLife: {default: sanity},
  experimental: {
    instantInsights: {validationLevel: 'warning'},
  },
  productionBrowserSourceMaps: true,
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
}

export default nextConfig
