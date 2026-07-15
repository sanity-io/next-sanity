import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    useTypeScriptCli: true,
  },
  productionBrowserSourceMaps: true,
}

export default nextConfig
