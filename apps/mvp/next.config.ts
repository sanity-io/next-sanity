import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
    instantInsights: {validationLevel: 'warning'},
  },
  productionBrowserSourceMaps: true,
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
}

export default nextConfig
