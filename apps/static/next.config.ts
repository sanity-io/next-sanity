import type {NextConfig} from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  output: 'export',
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  transpilePackages: ['@repo/sanity-config'],
  productionBrowserSourceMaps: true,
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
