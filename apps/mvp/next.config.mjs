import withBundleAnalyzer from '@next/bundle-analyzer'

function requireResolve(id) {
  return import.meta.resolve(id).replace('file://', '')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
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
      '@sanity/vision': requireResolve('@sanity/vision'),
      'sanity/_singletons': requireResolve('sanity/_singletons'),
      'sanity/desk': requireResolve('sanity/desk'),
      'sanity/presentation': requireResolve('sanity/presentation'),
      'sanity/router': requireResolve('sanity/router'),
      'sanity/structure': requireResolve('sanity/structure'),
      sanity: requireResolve('sanity'),
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
