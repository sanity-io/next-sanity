import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
