/** @type {import('next').NextConfig} */
const nextConfig = {
  // eslint-disable-next-line no-warning-comments
  // @TODO figure out why the swc minifier breaks preview mode
  // swcMinify: false,

  experimental: {
    appDir: true,
  },

  // We run these checks in the CI pipeline, so we don't need to run them on Vercel
  typescript: {ignoreBuildErrors: true},
  eslint: {ignoreDuringBuilds: true},
}

export default nextConfig
