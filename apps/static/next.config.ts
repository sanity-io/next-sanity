import type {NextConfig} from 'next'


const nextConfig: NextConfig = {
  output: 'export',
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
}

export default nextConfig
