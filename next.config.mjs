import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    logging: 'verbose',
  },
  productionBrowserSourceMaps: true,

  // We run these checks in the CI pipeline, so we don't need to run them on Vercel
  typescript: {ignoreBuildErrors: true},
  eslint: {ignoreDuringBuilds: true},

  // Handle static image imports the same in `npx next dev` as in `npm run build`
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ico|svg|png)$/i,
      use: [{loader: 'url-loader', options: {}}],
    })

    return config
  },
  images: {disableStaticImages: true, loader: 'custom', loaderFile: './app/sanity.image.ts'},
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
