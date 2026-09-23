# @repo/ailf

AI Literacy Framework (AILF) evaluation setup for `next-sanity`. AILF measures how well AI coding agents can use a Sanity domain from its published docs. For `next-sanity` specifically, it measures whether an agent working on a realistic Next.js App Router task discovers the library, reaches for the right APIs (`defineLive`, `sanityFetch`, `SanityLive`, `defineEnableDraftMode`, `VisualEditing`, TypeGen, ...), and integrates them correctly.

Evaluations run automatically via `.github/workflows/ailf-eval.yml` on PRs touching this package, on a weekly schedule, and via manual dispatch.

## What is being graded

Each `.task.ts` file describes a scenario a Next.js developer might hit (an outcome, framed with the app's existing code). Every task pairs with a `.reference.tsx` file — a human-facing answer key showing the idiomatic `next-sanity` solution, using `// --- path/to/file.tsx ---` separators for multi-file solutions. When AILF runs remotely, it prompts multiple LLMs (GPT and Claude variants) with the task, and grades their output against two rubrics:

- **`task-completion`** — does the output achieve the goal (live updates, draft preview, working types, ...)?
- **`code-correctness`** — does the output reach for `next-sanity` APIs rather than hand-rolling equivalents or using deprecated packages?

The reference solution is never shown to the evaluated model and does not contribute to scoring — grading is driven by the assertions and the canonical documentation.

## Task inventory

| Task                                                                                               | Probes                                                                                |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`add-live-to-client-fetch-app`](.ailf/tasks/add-live-to-client-fetch-app.task.ts)                 | Adding Sanity Live to an App Router blog that fetches with plain `@sanity/client`     |
| [`migrate-live-app-to-cache-components`](.ailf/tasks/migrate-live-app-to-cache-components.task.ts) | Migrating a Sanity Live app from ISR/revalidation to Cache Components with parity     |
| [`add-live-to-cache-components-app`](.ailf/tasks/add-live-to-cache-components-app.task.ts)         | Adding Sanity Live to an app already on `cacheComponents` with raw client fetches     |
| [`setup-sync-tag-invalidate-function`](.ailf/tasks/setup-sync-tag-invalidate-function.task.ts)     | Server-side invalidation with a Sync Tag Invalidate Function and `waitFor="function"` |
| [`add-visual-editing-draft-mode`](.ailf/tasks/add-visual-editing-draft-mode.task.ts)               | Draft Mode + Visual Editing (`defineEnableDraftMode`, `VisualEditing`, Presentation)  |
| [`debug-stega-encoding-bugs`](.ailf/tasks/debug-stega-encoding-bugs.task.ts)                       | Diagnosing stega-encoded strings leaking into app logic, fixing with `stegaClean`     |
| [`setup-typegen-strict-portable-text`](.ailf/tasks/setup-typegen-strict-portable-text.task.ts)     | Sanity TypeGen setup including strict Portable Text inference                         |

## Running locally

Validate task files (no API key needed):

```bash
pnpm --filter @repo/ailf run ailf:validate
```

Run a smoke evaluation against the AILF API (uses `AILF_CLASSIFICATION=adhoc` so it stays out of trusted dashboards):

```bash
# Set AILF_API_KEY in your environment. Sanity employees can fetch it from 1Password
# (item "AI Literacy Framework - Shared API Tokens" in the Shared vault, field AILF_API_KEY_DEV).
# With 1Password CLI available: export AILF_API_KEY=$(op read "op://Shared/AI Literacy Framework - Shared API Tokens/AILF_API_KEY_DEV")
export AILF_API_KEY=...
pnpm --filter @repo/ailf run ailf:smoke
```

`ailf:smoke` runs with `--debug` for a fast subset. For a full run, invoke the CLI directly: `pnpm --filter @repo/ailf exec ailf run --remote`.

## Adding a task

1. Pick a scenario a Next.js developer would plausibly hit while integrating Sanity.
2. Write `<id>.task.ts` with the scenario framing in the prompt, including the app's existing code inline. Study any existing task file for the shape.
3. Write `<id>.reference.tsx` with a real working solution. Use `// --- path/to/file.tsx ---` comment separators for multi-file solutions. Reference imports are intentionally unresolved in tsc/oxlint — the file is an answer key, not compiled (it is ignored via `.oxlintrc.json` and this package's `tsconfig.json`).
4. Assertions should include both `task-completion` and `code-correctness` rubrics when the "did they reach for `next-sanity`" question matters, plus cheap `contains`/`not-contains` guards.
5. `pnpm --filter @repo/ailf run ailf:validate` to confirm the file parses.
6. Commit and open a PR — the workflow runs the full eval when AILF files change.

## Scores and the trusted dashboard

Every remote run writes a report to Sanity (`ailf-prod-private` dataset, `ailf.report` type). Reports from this repo have:

- `classification: 'adhoc'` — CI runs, set by the `AILF_CLASSIFICATION` env var in the workflow. These do not aggregate into trusted dashboards.
- `area: 'next-sanity'` — separates these scores from the framework's own production `nextjs-live`/`visual-editing` areas.
- `repo: 'sanity-io/next-sanity'` — correct attribution.

If you run `ailf run --remote` locally without `AILF_CLASSIFICATION=adhoc`, the run may land in the trusted view. Use the `ailf:smoke` script above, which sets the env var, or set it manually.
