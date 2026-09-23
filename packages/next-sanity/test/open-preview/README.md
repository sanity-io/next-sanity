# Open preview integration test

`OpenPreview.browser.test.ts` starts the MVP Next.js app once and drives its embedded Studio with
the Playwright provider behind Vitest Browser Mode. The browser opens Studio at
`http://localhost:3000/studio` and Presentation previews
`http://127.0.0.1:3000/open-preview`. These are different browser sites, so the test covers the
partitioned-cookie behavior that only occurs when Studio and the frontend are cross-site.

The test requires a robot or user token with access to the configured project and dataset:

```sh
export SANITY_TEST_STUDIO_AUTH_TOKEN=...
export SANITY_E2E_PROJECT_ID=ppsg7ml5 # optional; this is the default
export SANITY_E2E_DATASET=test         # optional; this is the default
pnpm test:e2e
```

The test fails immediately when `SANITY_TEST_STUDIO_AUTH_TOKEN` is missing; it is never silently
skipped.

To test an unreleased Studio fix, select its `pkg.pr.new` package when installing and then run the
same test:

```sh
pnpm install --config.overrides.sanity=https://pkg.pr.new/sanity-io/sanity@<sha>
SANITY_TEST_STUDIO_AUTH_TOKEN=... pnpm test:e2e
```
