import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    useTypeScriptCli: true,
  },
}

export default nextConfig
