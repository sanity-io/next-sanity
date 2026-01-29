---
name: core-config
description: tsdown configuration file setup, defineConfig helper, multiple configs
---

# tsdown Configuration

tsdown searches for a configuration file by looking in the current directory and traversing upward.

## Supported Config Files

- `tsdown.config.ts` / `tsdown.config.mts` / `tsdown.config.cts`
- `tsdown.config.js` / `tsdown.config.mjs` / `tsdown.config.cjs`
- `tsdown.config.json` / `tsdown.config`
- `tsdown` field in `package.json`

## Basic Configuration

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  dts: true,
  exports: true,
})
```

## Multiple Configurations

Build multiple outputs with different settings:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: 'src/entry1.ts',
    platform: 'node',
  },
  {
    entry: 'src/entry2.ts',
    platform: 'browser',
  },
])
```

## Custom Config File

```bash
tsdown --config ./path/to/config
```

## Disable Config File

```bash
tsdown --no-config
```

## Config Loaders

```bash
# Auto (default): native TypeScript if supported, otherwise unrun
tsdown --config-loader auto

# Native: requires Node.js with TypeScript support
tsdown --config-loader native

# Unrun: more powerful loading capabilities
tsdown --config-loader unrun
```

## Extending Vite/Vitest Config (Experimental)

Reuse `resolve` and `plugins` from existing Vite/Vitest configs:

```bash
tsdown --from-vite        # Load vite.config.*
tsdown --from-vite vitest # Load vitest.config.*
```

<!-- 
Source references:
- https://tsdown.dev/options/config-file
-->
