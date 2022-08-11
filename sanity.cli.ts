/* eslint-disable no-process-env */
import {loadEnvConfig} from '@next/env'
import {createCliConfig} from 'sanity/cli'

const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig(__dirname, dev, {info: () => null, error: console.error})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default createCliConfig({api: {projectId, dataset}})
