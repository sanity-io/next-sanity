import {renderToReadableStream} from 'react-dom/server'
import {defineConfig} from 'sanity'
import {expect, test} from 'vitest'

import {NextStudio} from '../src/studio/client-component'
import {dataset, projectId} from './helpers'

const config = defineConfig({projectId, dataset})

test('server-renders without errors, deferring the Studio to the client', async () => {
  const errors: unknown[] = []
  const stream = await renderToReadableStream(<NextStudio config={config} />, {
    onError: (error) => {
      errors.push(error)
    },
  })
  await stream.allReady
  const html = await new Response(stream).text()

  expect(errors).toEqual([])
  expect(html).toMatch(/^<!--\$!-->/)
  expect(html).not.toContain('data-ui="NextStudioLayout"')
})
