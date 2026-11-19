import {relatedProjects, withRelatedProject} from '@vercel/related-projects'
import type {NextConfig} from 'next'

// Same lookup as `apps/mvp/next.config.ts`: the Studio project is matched by its id in `vercel.json`.
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
