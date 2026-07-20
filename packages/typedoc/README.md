# @repo/typedoc

Internal workspace that generates the TypeDoc reference documentation for `next-sanity`, used by the `Upload Docs` GitHub Actions workflow.

It lives in its own workspace so it can depend on TypeScript 6.x: the monorepo catalog uses TypeScript 7 (tsgo), which `typedoc` does not support yet (its peer range tops out at `6.0.x`). Keep the `typescript` dependency here on 6.x until TypeDoc adds TypeScript 7 support.

```sh
# from the repo root
pnpm run docs:generate
```

The generated output is written to `docs/next-sanity.json` and `docs/html` at the repository root.
