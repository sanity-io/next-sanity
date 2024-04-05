import {createRequire} from 'node:module'

import withBundleAnalyzer from '@next/bundle-analyzer'

const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    taint: true,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sanity/vision': require.resolve('@sanity/vision'),
      'sanity/_internalBrowser': require.resolve('sanity/_internalBrowser'),
      'sanity/desk': require.resolve('sanity/desk'),
      'sanity/presentation': require.resolve('sanity/presentation'),
      'sanity/router': require.resolve('sanity/router'),
      'sanity/structure': require.resolve('sanity/structure'),
      sanity: require.resolve('sanity'),
    }
    return config
  },

  async headers() {
    return [
      {
        // @TODO fix Presentation to never load itself recursively in an iframe
        source: '/studio/(.*)?', // Matches all studio routes
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
