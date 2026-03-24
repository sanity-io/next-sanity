import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
}

export default nextConfig
