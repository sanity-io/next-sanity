---
name: features-unbundle
description: tsdown unbundle mode for transpile-only builds
---

# Unbundle Mode

Outputs files that mirror your source structure instead of bundling into single files.

## Enable Unbundle Mode

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  unbundle: true,
})
```

## How It Works

Every source file referenced from entry points is compiled and output separately:

**Source:**
```
src/
  index.ts
  mod.ts
```

```ts
// src/index.ts
import { foo } from './mod'
foo()
```

```ts
// src/mod.ts
export function foo() {
  console.log('Hello from mod!')
}
```

**Output with `unbundle: true`:**
```
dist/
  index.js
  mod.js
```

Each output file corresponds directly to its source file.

## When to Use

- **Clear source-to-output mapping** - Easy to trace output back to source
- **Monorepo/library scenarios** - Consumers can import individual modules
- **Transpile-only builds** - Focus on transformation without combining files

<!-- 
Source references:
- https://tsdown.dev/options/unbundle
-->
