'use client'

/* eslint-disable no-restricted-globals */
/* eslint-disable no-process-env */
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

function createConfig(stable: boolean) {
  const name = stable ? 'stable' : 'experimental'
  const presentationTool = stable ? stablePresentationTool : experimentalPresentationTool
  return defineConfig({
    name,
    basePath: `/studio/${name}`,

    projectId,
    dataset,

    plugins: [
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

export default [createConfig(true), createConfig(false)]
