import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The Presentation emulator is served from 127.0.0.1 and iframes the app on localhost
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
