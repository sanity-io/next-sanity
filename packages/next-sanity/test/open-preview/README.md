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
pnpm playwright install chromium
pnpm test:e2e:open-preview
```

The test fails immediately when `SANITY_TEST_STUDIO_AUTH_TOKEN` is missing; it is never silently
skipped. `pnpm test:e2e` still runs the existing in-process browser suite and does not start the
Studio fixture.

To test an unreleased Studio fix, select its `pkg.pr.new` package when installing and then run the
same test:

```sh
pnpm test:e2e:install-studio https://pkg.pr.new/sanity-io/sanity@<sha>
SANITY_TEST_STUDIO_AUTH_TOKEN=... pnpm test:e2e:open-preview
```

The installer temporarily changes the workspace override, installs without modifying the lockfile,
and restores `pnpm-workspace.yaml` even if installation fails. A published baseline can be selected
the same way, for example `pnpm test:e2e:install-studio 6.12.0`.

Every `pkg.pr.new` build of a PR reports the same semver, so two of them can end up installed at
once and webpack then bundles both. Studio crashes on `Duplicate instances of context
"sanity/_singletons/…" with incompatible versions` and the test reports a Presentation tree that
never loads. The installer removes previously installed `pkg.pr.new` Studio copies and
`apps/mvp/.next` before installing the selected build.

The fixture serves Next on `0.0.0.0:3000`, which is IPv4 only. On hosts where `localhost` resolves
to `::1` first and has no IPv6 listener, Node's `fetch` falls back to IPv4 while the browser may
not, so Studio can fail to load at `http://localhost:3000` even though readiness on
`http://127.0.0.1:3000` succeeded.
