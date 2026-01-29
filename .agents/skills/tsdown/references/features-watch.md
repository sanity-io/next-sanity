---
name: features-watch
description: tsdown watch mode for automatic rebuilds
---

# Watch Mode

Automatically rebuild when files change.

## Enable Watch Mode

```bash
tsdown --watch
tsdown -w
```

## Watch Specific Paths

```bash
# Watch specific directory
tsdown --watch ./src

# Watch specific file
tsdown --watch ./src/index.ts
```

## Ignore Paths

```bash
tsdown --watch --ignore-watch node_modules
```

## Post-Build Command

Run a command after each successful build:

```bash
tsdown --watch --on-success "echo Build complete!"
tsdown -w --on-success "node dist/index.mjs"
```

## Config File

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  watch: true,
  // Or specify paths to watch
  // watch: ['./src', './lib']
})
```

> **Tip:** Watch mode eliminates manual rebuilds during development.

<!-- 
Source references:
- https://tsdown.dev/options/watch-mode
-->
