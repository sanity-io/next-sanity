import {relatedProjects, withRelatedProject} from '@vercel/related-projects'
import {defineCliConfig} from 'sanity/cli'

// Resolved in Node, before Vite inlines `SANITY_STUDIO_*` into the browser bundle.
// `sanity.config.ts` cannot call `@vercel/related-projects` itself: that package
// reads `VERCEL_RELATED_PROJECTS`, which is not exposed to the Studio client.
// An explicit origin (local `.env`, the open-preview test) wins. Otherwise the
// matching `apps/mvp` deployment is used, then `http://localhost:3000`. The project
// is matched by its id in `vercel.json`, since `withRelatedProject` looks up by name.
if (!process.env.SANITY_STUDIO_PREVIEW_ORIGIN) {
  const frontendProject = relatedProjects({noThrow: true}).find(
    ({project}) => project.id === 'prj_01qQA71qtcOv7dx28IEI2fQKRIve',
  )
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN = withRelatedProject({
    projectName: frontendProject?.project.name ?? '',
    defaultHost: 'http://localhost:3000',
  })
}

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  // Keeps the committed `schema.json`, which the Next.js apps run TypeGen against, in sync while
  // running `sanity dev` and `sanity build`.
  schemaExtraction: {enabled: true},
})
