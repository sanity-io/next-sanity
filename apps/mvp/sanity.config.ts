'use client'

/* eslint-disable no-restricted-globals */
/* eslint-disable no-process-env */
import {assist} from '@sanity/assist'
import {presentationTool as experimentalPresentationTool} from '@sanity/presentation'
import {debugSecrets} from '@sanity/preview-url-secret/sanity-plugin-debug-secrets'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {
  presentationTool as stablePresentationTool,
  type PreviewUrlResolverOptions,
} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

const previewMode = {
  enable: '/api/draft',
} satisfies PreviewUrlResolverOptions['previewMode']

function createConfig(basePath: string, stable: boolean) {
  const name = stable ? 'stable' : 'experimental'
  const presentationTool = stable ? stablePresentationTool : experimentalPresentationTool
  return defineConfig({
    name,
    basePath: `${process.env.NEXT_PUBLIC_TEST_BASE_PATH || ''}${basePath}/${name}`,
    // basePath: `${basePath}/${name}`,
    // basePath: `${name}`,

    projectId,
    dataset,

    plugins: [
      assist(),
      debugSecrets(),
      presentationTool({
        previewUrl: {previewMode},
      }),
      structureTool(),
      visionTool(),
    ],

    schema: {
      types: schemaTypes,
    },
  })
}

export function createConfigWithBasePath(basePath: string) {
  return [createConfig(basePath, true), createConfig(basePath, false)]
}

export default createConfigWithBasePath('/studio')
