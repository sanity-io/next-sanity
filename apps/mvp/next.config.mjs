import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    taint: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  productionBrowserSourceMaps: true,

  // Handle static image imports the same in `npx next dev` as in `npm run build`
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ico|svg|png)$/i,
      use: [{loader: 'url-loader', options: {}}],
    })

    return config
  },
  images: {disableStaticImages: true},
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
