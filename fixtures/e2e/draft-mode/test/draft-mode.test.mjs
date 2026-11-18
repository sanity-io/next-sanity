import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createRequire} from 'node:module'
import {after, before, describe, it} from 'node:test'
import {fileURLToPath} from 'node:url'

import {chromium} from 'playwright'

import {startMockSanity, VALID_SECRET} from './mock-sanity.mjs'

const cwd = fileURLToPath(new URL('..', import.meta.url))
const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next')
const PORT = 3210
const MOCK_SANITY_PORT = 3211
// The Presentation emulator runs on 127.0.0.1 and embeds the app on localhost, which is cross-site
const APP = `http://localhost:${PORT}`
const STUDIO = `http://127.0.0.1:${PORT}`
const enableUrl = (pathname) =>
  `${APP}/api/draft-mode/enable?sanity-preview-secret=${VALID_SECRET}&sanity-preview-perspective=drafts&sanity-preview-pathname=${encodeURIComponent(pathname)}`
const modes = (process.env.E2E_MODES || 'start,dev').split(',')

function run(args, env = {}) {
  const child = spawn(process.execPath, [nextBin, ...args], {
    cwd,
    detached: true,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      MOCK_SANITY_PORT: String(MOCK_SANITY_PORT),
      ...env,
    },
  })
  const output = []
  child.stdout.on('data', (chunk) => output.push(String(chunk)))
  child.stderr.on('data', (chunk) => output.push(String(chunk)))
  const exited = new Promise((resolve) => child.on('exit', resolve))
  return {child, output, exited}
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForServer(server) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) break
    // oxlint-disable-next-line no-await-in-loop
    const ok = await fetch(`${APP}/p/a`).then(
      (res) => res.ok,
      () => false,
    )
    if (ok) return
    // oxlint-disable-next-line no-await-in-loop
    await sleep(500)
  }
  throw new Error(`next did not start:\n${server.output.join('')}`)
}

async function expectText(locator, expected, timeout = 15_000) {
  const deadline = Date.now() + timeout
  let actual
  while (Date.now() < deadline) {
    // oxlint-disable-next-line no-await-in-loop
    actual = await locator.innerText({timeout: 1_000}).catch(() => undefined)
    if (actual === expected) return
    // oxlint-disable-next-line no-await-in-loop
    await sleep(100)
  }
  assert.equal(actual, expected)
}

const cookie = (setCookies, name) => setCookies.find((value) => value.startsWith(`${name}=`))

for (const mode of modes) {
  describe(`next ${mode}`, {timeout: 600_000}, () => {
    let mock
    let server
    let browser

    before(async () => {
      mock = await startMockSanity(MOCK_SANITY_PORT)
      if (mode === 'start') {
        const build = run(['build'])
        const code = await build.exited
        assert.equal(code, 0, build.output.join(''))
      }
      server = run([mode, '-p', String(PORT)])
      await waitForServer(server)
      browser = await chromium.launch()
    })

    after(async () => {
      await browser?.close()
      if (server?.child.exitCode === null) {
        process.kill(-server.child.pid, 'SIGTERM')
        await server.exited
      }
      await mock?.close()
    })

    it('rejects an invalid preview secret', async () => {
      const res = await fetch(
        `${APP}/api/draft-mode/enable?sanity-preview-secret=nope&sanity-preview-pathname=/p/a`,
        {redirect: 'manual'},
      )
      assert.equal(res.status, 401)
      assert.equal(cookie(res.headers.getSetCookie(), '__prerender_bypass'), undefined)
    })

    it('enables draft mode with SameSite=None cookies and redirects to the preview pathname', async () => {
      const res = await fetch(enableUrl('/p/a'), {redirect: 'manual'})
      assert.equal(res.status, 307)
      assert.equal(res.headers.get('location'), '/p/a?sanity-preview-perspective=drafts')
      const setCookies = res.headers.getSetCookie()
      const bypass = cookie(setCookies, '__prerender_bypass')
      assert.match(bypass, /HttpOnly/i)
      assert.match(bypass, /Secure/i)
      assert.match(bypass, /SameSite=None/i)
      assert.doesNotMatch(bypass, /Partitioned/i)
      assert.match(
        cookie(setCookies, 'sanity-preview-perspective'),
        /^sanity-preview-perspective=drafts;/,
      )
      assert.equal(cookie(setCookies, 'sanity-preview-partitioned'), undefined)
    })

    it('partitions the draft mode cookies when enabled from a cross-site iframe', async () => {
      const res = await fetch(enableUrl('/p/a'), {
        redirect: 'manual',
        headers: {'sec-fetch-dest': 'iframe', 'sec-fetch-site': 'cross-site'},
      })
      assert.equal(res.status, 307)
      const setCookies = res.headers.getSetCookie()
      assert.match(cookie(setCookies, '__prerender_bypass'), /Partitioned/i)
      assert.match(cookie(setCookies, 'sanity-preview-perspective'), /Partitioned/i)
      assert.ok(cookie(setCookies, 'sanity-preview-partitioned'))
    })

    it('renders draft content with stega, across client navigations and Live events', async () => {
      mock.reset()
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto(enableUrl('/p/a'))
      await expectText(page.locator('#draft-mode'), 'DRAFT')
      await expectText(page.locator('#title:visible'), 'Draft v1 (a)')
      await expectText(page.locator('#stega:visible'), 'encoded')

      await page.locator('#other:visible').click()
      await page.waitForURL('**/p/b')
      await expectText(page.locator('#title:visible'), 'Draft v1 (b)')
      await page.locator('#other:visible').click()
      await page.waitForURL('**/p/a')
      await expectText(page.locator('#title:visible'), 'Draft v1 (a)')

      mock.state.draft = 'Draft v2'
      assert.ok(mock.emit(['s1:post']) > 0, 'SanityLive should be subscribed to Live events')
      await expectText(page.locator('#title:visible'), 'Draft v2 (a)')

      await page.goto(`${APP}/api/draft-mode/disable?redirect=/p/a`)
      await expectText(page.locator('#draft-mode'), 'PUBLISHED')
      await expectText(page.locator('#title:visible'), 'Published v1 (a)')
      await expectText(page.locator('#stega:visible'), 'clean')
      await context.close()
    })

    it('renders draft content after a Server Action toggles draft mode', async () => {
      mock.reset()
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto(`${APP}/p/a`)
      await expectText(page.locator('#title:visible'), 'Published v1 (a)')

      await page.locator('#toggle-draft-mode:visible').click()
      await expectText(page.locator('#draft-mode'), 'DRAFT')
      await expectText(page.locator('#title:visible'), 'Draft v1 (a)')
      await page.locator('#other:visible').click()
      await page.waitForURL('**/p/b')
      await expectText(page.locator('#title:visible'), 'Draft v1 (b)')

      await page.locator('#toggle-draft-mode:visible').click()
      await expectText(page.locator('#draft-mode'), 'PUBLISHED')
      await expectText(page.locator('#title:visible'), 'Published v1 (b)')
      await context.close()
    })

    for (const blockThirdPartyCookies of [false, true]) {
      it(`connects to Presentation in a cross-site iframe and follows perspective changes${blockThirdPartyCookies ? ' with third-party cookies blocked' : ''}`, async () => {
        mock.reset()
        const context = await browser.newContext()
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        if (blockThirdPartyCookies) {
          const cdp = await context.newCDPSession(page)
          await cdp.send('Network.enable')
          await cdp.send('Network.setCookieControls', {
            enableThirdPartyCookieRestriction: true,
            disableThirdPartyCookieMetadata: true,
            disableThirdPartyCookieHeuristics: true,
          })
        }
        await page.goto(`${STUDIO}/presentation?src=${encodeURIComponent(enableUrl('/p/a'))}`)
        const preview = page.frameLocator('#preview')
        await expectText(preview.locator('#draft-mode'), 'DRAFT', 60_000)
        await expectText(preview.locator('#title:visible'), 'Draft v1 (a)')
        await expectText(page.locator('#status'), 'connected', 30_000)
        await expectText(preview.locator('#presentation-tool'), 'true')
        assert.notEqual(await page.locator('#perspective-requests').innerText(), '0')

        await page.locator('#perspective-published').click()
        await expectText(preview.locator('#title:visible'), 'Published v1 (a)')
        await expectText(preview.locator('#draft-mode'), 'DRAFT')
        await page.locator('#perspective-drafts').click()
        await expectText(preview.locator('#title:visible'), 'Draft v1 (a)')
        assert.deepEqual(errors, [])
        await context.close()
      })
    }

    it('keeps serving published content to visitors without draft mode', async () => {
      const html = await (await fetch(`${APP}/p/a`)).text()
      assert.match(html, /id="draft-mode">PUBLISHED</)
      assert.match(html, /id="title">Published v1 \(a\)</)
    })

    it('logs no cache miss warnings', () => {
      assert.doesNotMatch(server.output.join(''), /Unexpected cache miss/)
    })
  })
}
