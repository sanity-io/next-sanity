import type {NextConfig} from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

// function requireResolve(id) {
//   return import.meta.resolve(id).replace('file://', '')
// }

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
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
