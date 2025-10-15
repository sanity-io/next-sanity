import type {NextConfig} from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  experimental: {
    cacheComponents: true,
    cacheLife: {
      default: {
        // Sanity Live handles on-demand revalidation, so the default 15min time based revalidation is too short
        revalidate: 60 * 60 * 24 * 90, // 90 days
      },
    },
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
