import {withRelatedProject} from '@vercel/related-projects'
import type {NextConfig} from 'next'

// Same contract as `apps/mvp/next.config.ts`: the Studio project is named
// `next-sanity-studio`, and its id placeholder lives in this app's `vercel.json`.
const studioUrl = withRelatedProject({
  projectName: 'next-sanity-studio',
  defaultHost: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
})

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SANITY_STUDIO_URL: studioUrl,
  },
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
