---
name: core-entry
description: tsdown entry points configuration with aliases and glob patterns
---

# Entry Points

Entry files are the starting points for the bundling process.

## CLI Usage

```bash
tsdown src/entry1.ts src/entry2.ts
```

## Config File

### Single Entry

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
})
```

### Multiple Entries

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/entry1.ts', 'src/entry2.ts'],
})
```

### Entry Aliases

Use an object to define custom output names:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    main: 'src/index.ts',
    utils: 'src/utils.ts',
  },
})
```

Output: `dist/main.js` and `dist/utils.js`

## Glob Patterns

Match multiple files dynamically:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/**/*.ts',
})
```

This includes all `.ts` files in `src` and subdirectories as entry points.

> **Note:** On Windows, use forward slashes (`/`) in glob patterns, not backslashes.

<!-- 
Source references:
- https://tsdown.dev/options/entry
-->
