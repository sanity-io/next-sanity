---
name: options-package-exports
description: tsdown auto-generating package.json exports, main, module, types fields
---

# Auto-Generating Package Exports

tsdown can automatically generate `exports`, `main`, `module`, and `types` fields in `package.json`.

## Enable Auto Exports

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
})
```

Or via CLI:

```bash
tsdown --exports
```

> **Warning:** Review generated fields before publishing.

## Export All Files

By default, only entry files are exported. To export all files:

```ts
export default defineConfig({
  exports: {
    all: true,
  },
})
```

## Dev-Time Source Linking

### Dev Exports

Point exports to source files during development:

```ts
export default defineConfig({
  exports: {
    devExports: true,
  },
})
```

- Top-level `exports` points to source code
- `publishConfig.exports` contains built paths (used by `pnpm`/`yarn` publish)

> **Note:** `npm` does not support `publishConfig.exports` override.

### Conditional Dev Exports

Link to source only under specific conditions:

```ts
export default defineConfig({
  exports: {
    devExports: 'development',
  },
})
```

Combine with TypeScript's `customConditions` for type-safe dev imports.

## CSS Exports

When CSS splitting is disabled, CSS is auto-added to exports:

```ts
export default defineConfig({
  css: {
    splitting: false,
  },
  exports: true,
})
```

Custom CSS filename:

```ts
export default defineConfig({
  css: {
    splitting: false,
    fileName: 'my-library.css',
  },
  exports: true,
})
```

## Custom Exports

```ts
export default defineConfig({
  exports: {
    customExports(pkg, context) {
      pkg['./foo'] = './foo.js'
      return pkg
    },
  },
})
```

<!-- 
Source references:
- https://tsdown.dev/options/package-exports
-->
