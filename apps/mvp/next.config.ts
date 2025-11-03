import type {NextConfig} from 'next'
import {createRequire} from 'node:module'
import path from 'node:path'

import withBundleAnalyzer from '@next/bundle-analyzer'

const require = createRequire(import.meta.url)

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  cacheComponents: true,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    // Resolve sanity package duplicates by forcing all imports to use the same version
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force all sanity imports to use a single resolved version
      'sanity$': require.resolve('sanity'),
      'sanity/*': path.resolve(require.resolve('sanity'), '..', '*'),
    }

    return config
  },
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
