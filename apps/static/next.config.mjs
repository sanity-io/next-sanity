import withBundleAnalyzer from '@next/bundle-analyzer'

function requireResolve(id) {
  return import.meta.resolve(id).replace('file://', '')
}

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
      '@sanity/vision': requireResolve('@sanity/vision'),
      'sanity/_internalBrowser': requireResolve('sanity/_internalBrowser'),
      'sanity/desk': requireResolve('sanity/desk'),
      'sanity/presentation': requireResolve('sanity/presentation'),
      'sanity/router': requireResolve('sanity/router'),
      'sanity/structure': requireResolve('sanity/structure'),
      sanity: requireResolve('sanity'),
    }
    return config
  },
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
