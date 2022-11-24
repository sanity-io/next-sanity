/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    runtime: 'experimental-edge',
    transpilePackages: ['@sanity/client', 'groq', 'groqd'],
  },

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
  images: {disableStaticImages: true},
}

export default nextConfig
