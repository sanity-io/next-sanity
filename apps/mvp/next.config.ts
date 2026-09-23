import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const useWebpack = process.env.NEXT_E2E_WEBPACK === 'true'

const nextConfig: NextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  cacheComponents: true,
  cacheLife: {default: sanity},
  productionBrowserSourceMaps: true,
  reactCompiler: true,
  experimental: {
    ...(!useWebpack && {turbopackRustReactCompiler: true}),
    useTypeScriptCli: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
}

export default nextConfig
