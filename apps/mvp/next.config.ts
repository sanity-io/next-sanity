import {withRelatedProject} from '@vercel/related-projects'
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const useWebpack = process.env.NEXT_E2E_WEBPACK === 'true'

// The Studio Vercel project must be named `next-sanity-studio`. Its id is the
// placeholder in `vercel.json` (`prj_REPLACE_WITH_NEXT_SANITY_STUDIO_PROJECT_ID`).
// `withRelatedProject` returns this host unless `VERCEL_ENV` is `preview` or
// `production` and that project is in `VERCEL_RELATED_PROJECTS`, so local dev
// and the open-preview test keep localhost or `NEXT_PUBLIC_SANITY_STUDIO_URL`.
const studioUrl = withRelatedProject({
  projectName: 'next-sanity-studio',
  defaultHost: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
})

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SANITY_STUDIO_URL: studioUrl,
  },
  cacheComponents: true,
  cacheLife: {default: sanity},
  productionBrowserSourceMaps: true,
  reactCompiler: !useWebpack,
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
