/** @type {import('next').NextConfig} */
const nextConfig = {
  // eslint-disable-next-line no-warning-comments
  // @TODO figure out why the swc minifier breaks preview mode
  swcMinify: false,

  experimental: {
    appDir: true,
  },
}

export default nextConfig
