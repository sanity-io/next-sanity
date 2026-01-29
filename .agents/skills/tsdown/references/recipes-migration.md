---
name: recipes-migration
description: Migrating from tsup to tsdown
---

# Migrating from tsup

tsdown is designed as a faster alternative to tsup, built on Rolldown instead of esbuild.

## Automatic Migration

```bash
npx tsdown-migrate
```

For monorepos:

```bash
npx tsdown-migrate packages/*
npx tsdown-migrate packages/foo packages/bar
```

### Options

- `[...dirs]` - Directories to migrate (supports globs)
- `--dry-run` / `-d` - Preview changes without modifying files

> **Warning:** Save/commit changes before migration.

## Differences from tsup

### Changed Defaults

| Option | tsup | tsdown |
|--------|------|--------|
| `format` | - | `esm` |
| `clean` | `false` | `true` |
| `dts` | `false` | Auto-enabled if `types` field exists |
| `target` | - | Reads from `engines.node` |

### New Features

- **`nodeProtocol`** - Control Node.js built-in imports:
  - `true` - Add `node:` prefix (`fs` → `node:fs`)
  - `'strip'` - Remove prefix (`node:fs` → `fs`)
  - `false` - Keep as-is (default)

### Feature Gaps

Some tsup features may not yet be implemented. [Open an issue](https://github.com/rolldown/tsdown/issues) if needed.

## Why No Stub Mode?

tsdown does not support stub mode because:

- Requires re-running stub command when named exports change
- Incompatible with plugins

### Alternatives to Stub Mode

1. **Watch Mode** - Auto-rebuild on changes:
   ```bash
   tsdown --watch
   ```

2. **Dev Exports** - Point to source during development:
   ```ts
   export default defineConfig({
     exports: {
       devExports: true,
     },
   })
   ```

3. **TypeScript Runners** - Run source directly:
   - With plugins: [vite-node](https://github.com/antfu-collective/vite-node)
   - Without plugins: [tsx](https://github.com/privatenumber/tsx), [jiti](https://github.com/unjs/jiti)
   - Node.js v22.18+: Native TypeScript support

<!-- 
Source references:
- https://tsdown.dev/guide/migrate-from-tsup
- https://tsdown.dev/guide/faq
-->
