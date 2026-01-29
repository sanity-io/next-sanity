---
name: advanced-programmatic
description: Using tsdown programmatically from JavaScript/TypeScript
---

# Programmatic Usage

Use tsdown directly from code for custom build scripts and automation.

## Basic Example

```ts
import { build } from 'tsdown'

await build({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  dts: true,
})
```

## Full Example

```ts
import { build } from 'tsdown'

await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  dts: true,
  exports: true,
  target: 'es2020',
  platform: 'node',
  clean: true,
  sourcemap: true,
  minify: false,
  external: ['lodash'],
  plugins: [
    // Your plugins here
  ],
})
```

## Multiple Builds

```ts
import { build } from 'tsdown'

// Build multiple configurations
await build([
  {
    entry: ['src/node.ts'],
    platform: 'node',
    outDir: 'dist/node',
  },
  {
    entry: ['src/browser.ts'],
    platform: 'browser',
    outDir: 'dist/browser',
  },
])
```

## Use Cases

- Custom build scripts
- CI/CD pipelines
- Build orchestration tools
- Programmatic library building

All CLI options are available as properties in the options object.

<!-- 
Source references:
- https://tsdown.dev/advanced/programmatic-usage
-->
