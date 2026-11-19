import {relatedProjects, withRelatedProject} from '@vercel/related-projects'
import type {NextConfig} from 'next'
import {sanity} from 'next-sanity/live/cache-life'

const useWebpack = process.env.NEXT_E2E_WEBPACK === 'true'

// Matched by the Studio project id in `vercel.json`, since `withRelatedProject` looks up by name
// and Vercel project names can change. Without a match, or outside `VERCEL_ENV` preview and
// production, local dev and the open-preview test keep `NEXT_PUBLIC_SANITY_STUDIO_URL` or localhost.
const studioProject = relatedProjects({noThrow: true}).find(
  ({project}) => project.id === 'prj_jWPnVeIEPKmKzDLTSf1Sx7sl9wHu',
)
const studioUrl = withRelatedProject({
  projectName: studioProject?.project.name ?? '',
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
