import {createRequire} from 'node:module'

import withBundleAnalyzer from '@next/bundle-analyzer'

const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sanity/_internal': require.resolve('sanity/_internal'),
      'sanity/_internalBrowser': require.resolve('sanity/_internalBrowser'),
      'sanity/cli': require.resolve('sanity/cli'),
      'sanity/desk': require.resolve('sanity/desk'),
      'sanity/router': require.resolve('sanity/router'),
      'sanity/structure': require.resolve('sanity/structure'),
      'sanity/presentation': require.resolve('sanity/presentation'),
      sanity: require.resolve('sanity'),
    }
    return config
  },
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
