'use client'

/* eslint-disable no-restricted-globals */
/* eslint-disable no-process-env */
import sharedConfig from '@repo/sanity-config'
import {debugSecrets} from '@sanity/preview-url-secret/sanity-plugin-debug-secrets'
import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  projectId,
  dataset,

  plugins: [presentationTool({}), sharedConfig(), debugSecrets()],
})
